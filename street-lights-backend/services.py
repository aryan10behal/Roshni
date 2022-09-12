import fastapi as _fastapi
import fastapi.security as _security
import jwt as _jwt
import datetime as _dt
import sqlalchemy.orm as _orm
import passlib.hash as _hash
from dotenv import load_dotenv
import database as _database, models as _models, schemas as _schemas
import uuid
import pymongo

myclient = pymongo.MongoClient("mongodb://localhost:27017/")

database = myclient["street-lights-db"]

oauth2schema = _security.OAuth2PasswordBearer(tokenUrl="/api/token")
# unique_token = str(uuid.uuid1())



def create_database():
    return _database.Base.metadata.create_all(bind=_database.engine)


def get_db():
    db = _database.SessionLocal()
    try:
        yield db
    finally:
        db.close()


async def get_user_by_email(email: str, db: _orm.Session):
    return db.query(_models.User).filter(_models.User.email == email).first()


async def create_user(user: _schemas.UserCreate, db: _orm.Session):
    user_obj = _models.User(
        email=user.email, hashed_password=_hash.bcrypt.hash(user.hashed_password)
    )
    db.add(user_obj)
    db.commit()
    db.refresh(user_obj)
    return user_obj


async def authenticate_user(email: str, password: str, db: _orm.Session):
    user = await get_user_by_email(db=db, email=email)

    if not user:
        return False

    if not user.verify_password(password):
        return False

    return user


async def create_token(user: _models.User):
    unique_token = [token["unique_token"] for token in database['unique-token'].find() if token["unique_token"]][0]
    user_obj = _schemas.User.from_orm(user)

    print("\n\nunique token value#: ",unique_token)

    user_obj = user_obj.dict()
    user_obj['salt'] = str(uuid.uuid1())
    token = _jwt.encode(user_obj, unique_token)

    # token = _jwt.encode(user_obj.dict(), unique_token)
    print("encrypted token: ", unique_token)
    print("bhai token kya aaya hai?? ", token)
    print("\n\nunique token value from backend!! : ", unique_token, token)
    return dict(access_token=token, token_type="bearer")


async def get_current_user(
    db: _orm.Session = _fastapi.Depends(get_db),
    token: str = _fastapi.Depends(oauth2schema),
):
    unique_token = [token["unique_token"] for token in database['unique-token'].find() if token["unique_token"]][0]
    try:
        print("\n\nunique token value from frontend: ", unique_token, token)
        payload = _jwt.decode(token, unique_token, algorithms=["HS256"])
        user = db.query(_models.User).get(payload["id"])
    except Exception as e:
        print("error message", e)
        raise _fastapi.HTTPException(status_code=401, detail="Invalid Email or Password")

    return _schemas.User.from_orm(user)


async def delete_current_user(user: _models.User, db: _orm.Session):
    user_obj = _schemas.User.from_orm(user)
    user_obj = (
        db.query(_models.User).filter(_models.User.email == user_obj.email)
    )
    db.delete(user_obj)
    db.commit()


