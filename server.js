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
				
				tasks.push(allTasks[i]);		
			}
			callback(tasks);
			
		}
	});	
}
async function modifyTask(task)
{
	let progress={
		"TODO":"DONE",
		"DONE":"TODO"
		
	}
	database.ref('tasks/'+task).once('value')
	.then(function(snapshot) {
		console.log(snapshot.val());
		firebase.database().ref('tasks/' + task).set({
			desc:snapshot.val().desc,
			progress: progress[snapshot.val().progress],
			person:snapshot.val().person,
			
		});
	});
	
	
	
}

async function addTask(user,task){
	database.ref('tasks/').once('value')
	.then(function(snapshot) {
		let tasks = snapshot.val();
		tasks.push(task);
		
		firebase.database().ref('tasks/'+tasks.length).set(task);
		console.log(firebase.database().ref('users/'+task.person+"/tasks/"+user.tasks.length))
		firebase.database().ref('users/'+task.person+"/tasks/"+user.tasks.length).set(tasks.length);
	});
}
function deleteTask(user,task){
	const index = user.tasks.indexOf(task);
	user.tasks.splice(index, 1);
	
	database.ref('tasks/'+task).remove();
	database.ref('users/'+user.id+"/tasks").set(user.tasks);
}
//=================================================================

let app = express();
app.use(express.json())   
app.get('/', async function (req, res) {
   getUser(req.header('id'),(user)=>{
	   let end=(t)=>{res.end(JSON.stringify(t));};
	   if(user.isAdmin){
		   getTasks(true,end);   
	   }else{
		  
		   getTasks(user.tasks,end);
	   }
	      
   });
});
app.post('/', function (req, res) {
   getUser(req.header('id'),(user)=>{
	   console.log(req.body.task);
	   if(user.isAdmin||user.tasks.includes(req.body.task)){
		   modifyTask(req.body.task);	   
	   }   	   
   });
   res.end("OK");
});
app.put('/', function (req, res) {
   getUser(req.header('id'),(user)=>{
	   addTask(user,{
		    desc:req.body.desc,
		    person:req.body.person,
			progress:"TODO"   
	   })
   });
   res.end("OK");
   
});
app.delete('/', function (req, res) {
   getUser(req.header('id'),(user)=>{
	   user.id=req.header('id');
	   console.log(req.body.task);
	   if(user.isAdmin||user.tasks.includes(req.body.task)){
		   deleteTask(user,req.body.task);	   
	   }   	   
   });
   res.end("OK");
   
});
var server = app.listen(3000);