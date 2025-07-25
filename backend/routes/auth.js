const auth = require('express').Router()
const bcrypt = require('bcrypt')
const pool = require('../db.js');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
auth.post('/sign-up',async(req,res,next)=>{
    const {username,password,name,lastName} = req.body;

    const hashedPassword = await bcrypt.hash(password,10);
    try{
        await pool.query(`
        INSERT INTO users (username,name,last_name,password,role)
        VALUES ($1,$2,$3,$4,'member')
        
        `,[username,name,lastName,hashedPassword])

        res.status(200).send('good')

    }
    catch(error){
        next(error)
    }
})

passport.use(new LocalStrategy(async function verify (username,password,done){
    try{
        
        const {rows} = await pool.query(`SELECT * FROM users WHERE username = $1`,[username]);
        const user = rows[0];
        if(!user) return done(null,false,{message:'incorrect username'});
        const hashedPassword = user.password;
        if( ! await bcrypt.compare(password,hashedPassword)) return done(null,false, {message: 'incorrect password'});

        return done(null,user);

    }catch(err){
       
        return done(err);
    }
}))

passport.serializeUser(function(user,done){
    return done(null,user.id)
})

passport.deserializeUser(async(id,done)=>{
    try{
        const {rows} = await pool.query(`SELECT * from users WHERE id=$1 `,[id]);
        const user = rows[0];
      
        done(null,user)
    }catch(error){
        done(error)
    }
})

auth.get('/check-auth',(req,res,next)=>{
   
    try{
        if(req.isAuthenticated()){
            console.log('user authenticated')
            res.status(200).json({user:req.user,message:req.user.id})
        }
        else{
            console.log('user denied')
            res.status(401).json({message:'failed to autheenticate'})
        }
        
    }catch(error){
        next(error)
    }
    
})

auth.post('/log-out',(req,res,next)=>{
    req.logout(err =>{
        if(err){
            next(err)
        }
        console.log('logged out succesfully')
        res.json({message: 'logged out successfully'})
    })
})
auth.post('/log-in', (req, res, next) => {
  passport.authenticate('local', (err, user) => {
    if (user) {
      req.logIn(user, () => {
        console.log(req.user);
        res.json({ success: true, message: 'successful log-in; user authenticated' });
      });
    } else {
      res.json({ success: false, message: 'not successful' });
    }
  })(req, res, next);
});




module.exports = auth;