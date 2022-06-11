import React from "react";

const ErrorMessage = ({ message }) => (
  <p className="has-text-weight-bold has-text-danger" style={{color: "red"}}>{message}</p>
);

export default ErrorMessage;