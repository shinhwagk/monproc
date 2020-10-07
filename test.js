const fs = require('fs')

fs.watchFile('./watch/b',{interval:1000},(c,p)=>{
    console.log(111)
})
// .on('change',(x,b)=>console.log("change"))