let error = new Error("HI");
error.code = 300;

const { message, code } = error;
console.log(message, code);
