const express = require('express')
const app = express()
const compression = require('compression')
/* 这一行要在静态托管之前 */
app.use(compression())
app.use(express.static("./dist"))

/* 端口8081就不行 */
app.listen(80,()=>{
    console.log('server running at http://127.0.0.1');
})