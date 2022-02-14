import requests
from time import time
import socket

import requests.packages.urllib3.util.connection as urllib3_cn
urllib3_cn.allowed_gai_family = lambda : socket.AF_INET

start = time()
requests.get("http://localhost:8080")
end = time()
print(end - start)

start = time()
requests.get("https://www.google.com")
end = time()
print(end - start)

start = time()
requests.get("https://www.google.com")
end = time()
print(end - start)