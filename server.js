let express = require('express');

let firebase = require('firebase');
let firebaseConfig = {
    apiKey: "AIzaSyCX4efyv4661gZ7BGH9dfaPS3CFfNvMpr8",
    authDomain: "quickstart-1607596258465.firebaseapp.com",
    databaseURL: "https://quickstart-1607596258465-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "quickstart-1607596258465",
    storageBucket: "quickstart-1607596258465.appspot.com",
    messagingSenderId: "308458275816",
    appId: "1:308458275816:web:3c4a76474cf8a2c10d5a5d"
  };
  // Initialize Firebase
firebase.initializeApp(firebaseConfig);
let database = firebase.database();
let onError =(err)=>{console.log(err)};
//==================================================================

async function getUser(user,callback){
	database.ref('users/'+user).once('value')
	.then(function(snapshot) {
		console.log(snapshot.val())
		callback(snapshot.val());
	})
	
	
}
async function getTasks(tasksArr,callback){
	await database.ref('tasks/').once('value')
	.then(function(snapshot) {
		if(tasksArr===true){
			callback(snapshot.val());
			
		}else{
			let allTasks = snapshot.val();
			let tasks=[] ;
			
			for(let i of tasksArr){
				
				tasks[i] = allTasks[i];		
			}
			callback(tasks);
			
		}
	});	
}
async function modifyTask(task,callback)
{
	let progress={
		"TODO":"DONE",
		"DONE":"TODO"
		
	}
	database.ref('tasks/'+task).once('value')
	.then(function(snapshot) {
		if(!snapshot.val()){
			callback(false)
			return;
		};
		firebase.database().ref('tasks/' + task).set({
			desc:snapshot.val().desc,
			progress: progress[snapshot.val().progress],
			person:snapshot.val().person,
			
		});
		callback(true);
	});
	
	
	
}

async function addTask(user,task,callback){
	database.ref('tasks/').once('value')
	.then(function(snapshot) {
		let tasks = snapshot.val()?snapshot.val():[];
		let tasksId = tasks.indexOf(null)>0? tasks.indexOf(null):tasks.length;
		tasks[tasksId] = task;
		try{
			//console.log(firebase.database().ref('users/'+task.person+"/tasks/"+user.tasks.length))
			let index=user.tasks?user.tasks.length:0;
		
			firebase.database().ref('users/'+task.person+"/tasks/"+index).set(tasksId);
			firebase.database().ref('tasks/'+tasksId).set(task);
		}catch(e){
			console.log(e);
			callback(-1);
		}
		callback(tasksId);
	});
}
async function deleteTask(task){
	
	
	database.ref('tasks/'+task).once('value').then((snapshot)=>{
		
		database.ref('users/'+snapshot.val().person).once('value').then((snapshot2)=>{
			let user=snapshot2.val();
			console.log(user);
			const index = user.tasks.indexOf(task);
			user.tasks.splice(index,1);
			
			database.ref('users/'+snapshot.val().person+"/tasks").set(user.tasks);			
		});
		database.ref('tasks/'+task).remove();
		
		
		
	});
	
}
//=================================================================

let app = express();
app.use(express.json())   
app.get('/', async function (req, res) {
	if(!req.header('id')){
		res.send(401,"need id in header");
		return;
	}
	try{
		getUser(req.header('id'),(user)=>{
			//console.log(user);
			if(!user){
				res.send(401,"no such user exists");
				return;
			}
			let end=(t)=>{
				t.forEach((el,index)=>{
					if(el)el.id = index;
				})
				res.end(JSON.stringify(t.filter((el)=> {
					return el != null;
				})));	
			};
			if(user.isAdmin){
			   getTasks(true,end);   
			}else{
			   getTasks(user.tasks,end);
			}
			  
		});
	}catch(e){
		res.send(400,"bad request(make sure it is json)");
	}
});
app.post('/', function (req, res) {
    if(!req.header('id')){
	   res.send(401,"need id in header");
	}
	try{
		getUser(req.header('id'),(user)=>{
			if(!user){
				res.send(401,"no such user exists");
				return;
			}
			user.tasks=user.tasks?user.tasks:[];
			if(user.isAdmin||user.tasks.includes(req.body.task)){
			   modifyTask(req.body.task,(result)=>{
					if(!result){res.send(404,"task not found");return;}
					res.end("OK");				 				 		   
				});
			   
				   
			}else{
				res.send(401,"unauthorized for operation");
			}
	   });
	}catch(e){
		res.send(400,"bad request(make sure it is json)");
	}
   
});
app.put('/', function (req, res) {
   if(!req.header('id')){
	   res.send(401,"need id in header");
	   return;
   }
   try{
	   getUser(req.header('id'),(user)=>{
			if(!user){		
				res.send(401,"no such user exists");
				return;
			}
			//console.log(req.body);
			if(user.isAdmin||req.header('id')==req.body.person){
				getUser(req.body.person,(user)=>{
					if(!user){
						res.send(400,"no such user exists");
						return;
					}
					addTask(user,{
						desc:req.body.desc,
						person:req.body.person,
						progress:"TODO"   
					},(task)=>{
						if(task==-1){
							res.send(400,"no such user exists");
							return;
						}else{
							res.end("task id:"+task);
							return;
						}
					});
				});
			}else{
				//console.log(req.header('id'),req.body.person);
			   res.send(401,"unauthorized for operation");
			   return;
			}  
	   });
   }catch(e){
		res.send(400,"bad request(make sure it is json)");
	}
   
   
});
app.delete('/', function (req, res) {
	if(!req.header('id')){
		res.send(401,"need id in header");
		return;
	}
	try{
		getUser(req.header('id'),(user)=>{
			if(!user){
				res.send(401,"no such user exists");
				return;
			}
			user.id=req.header('id');
			console.log(req.body.task);
			user.tasks=user.tasks?user.tasks:[];
			if(user.isAdmin||user.tasks.includes(req.body.task)){
			   deleteTask(req.body.task);	
			   res.end("OK");  
			   return;
			}else{
			   res.send(401,"unauthorized for operation");
			   return;
			}   	   
		});
	}catch(e){
		res.send(400,"bad request(make sure it is json)");
	}
    
   
});
var server = app.listen(3000);