const express=require('express');
const app = express();
const port=10055;
const https = require('https');
const fs = require('fs');
var PythonShell = require('python-shell');
var mysql = require('mysql');
var con = mysql.createConnection({
    host: "localhost",
    port:3306,
    user: "wei",
    password: "zy123456789",
    database: "TSOC_KKBOX"
});
con.connect(function(err){
			 if (err) throw err;
const optionss = 
{
      ca: fs.readFileSync('./ssl/ca_bundle.crt'),
      cert: fs.readFileSync('./fullchain.pem'),
      key: fs.readFileSync('./privkey.pem')
}
//app.listen(port);

const bodyParser=require('body-parser');
const urlencodedParser=bodyParser.urlencoded({extended:true});
https.createServer(optionss, app).listen(port, () => console.log(`listen on port:`+ port));
app.use(express.static(__dirname+'/public'));
//紀錄使用者的選擇
app.post("/count",urlencodedParser,function(red,rep){
  fs.readFile("./public/"+red.body.which+".txt","utf8", (err, data) => {
    if (err) throw err;
    fs.writeFile("./public/"+red.body.which+".txt",data+","+red.body.howlong,function(error){
    })
	rep.send("");
})
})

app.post("/search",urlencodedParser,function(red,rep){
	console.log(red.body.word);
				var  options = {
					"method": "GET",
					"hostname": "api.kkbox.com",
					"port": null,
					"path": "/v1.1/search?q="+encodeURI(red.body.word)+"&type=track&territory=TW&offset=0&limit=3",
					"headers": {
					"accept": "application/json",
					"authorization": "Bearer A+1EPoA+f0ZAhz1Q+fh67w=="
					}
				};

				var req = https.request(options, function (res) {
				  var chunks = [];
				  res.on("data", function (chunk) {
					chunks.push(chunk);
				  });
				  res.on("end", function () {
					var body = Buffer.concat(chunks);
					rep.send(JSON.parse(body.toString()));
					});
				});
				req.end();
})

//搜尋關鍵詞推薦歌曲
app.post("/ajax_post",urlencodedParser,function(red,rep){
	var sttime = new Date();
	console.log(">>>>>>>>>>>>>>>>>>>>"+parseInt(red.body.wordlong) );
if(parseInt(red.body.wordlong) > 25){
	var thename=[]
	let pyshell = new PythonShell('../doc2vec/run2.py');
	var inputword=red.body.userinput.replace(/\r\n|\n/g,"")
	console.log(inputword);
	pyshell.stdin.write(inputword+"\n");
	pyshell.on('message', function (message) {
		// received a message sent from the Python script (a simple "print" statement)
		var backid = message.split(",");
		console.log("????????????"+message);
		function getprint(y){
						
			var x=2*y;
			var idnum=backid[x].slice(2);
			var idint = parseInt(idnum);
			//console.log(idnum);
			if(idint>-1 && idint<29656){
				console.log("#######"+idint);
				var sendid = idint+1;
				con.query("SELECT `name` FROM `chinese_boysong` WHERE id = "+(sendid), function (err, result, fields) {
					console.log(result[0].name);
					thename[y]=result[0].name;
				});
			}
			if(idint>29655){
				console.log("@@@@"+idint);
				var sendid = idint-29655;
				con.query("SELECT `name` FROM `chinese_girlsong` WHERE `id` = "+(sendid ), function (err, result, fields) {
					console.log(result[0].name);
					thename[y]=result[0].name;
				});
			}
			if(y!=0){
				getprint(y-1);
			}
		}
		getprint(9);
	});
	var backdata=[]; 
	async function thefinish(timeout){
      return new Promise((resolve)=>{
        setTimeout(()=>{
          if (thename[0]==undefined){
            resolve(thefinish(100));
          }
          else{
			console.log(thename);
			var check=[];
			function getdata(m,endtime){
				if((m-endtime+4)==1&&backdata[0]!=undefined){check[0]=backdata[0].tracks.data[0].url}
				if((m-endtime+4)==2&&backdata[1]!=undefined){check[1]=backdata[1].tracks.data[0].url}
				if((m-endtime+4)==3&&backdata[2]!=undefined){check[2]=backdata[2].tracks.data[0].url}
				if((m-endtime+4)==4&&backdata[3]!=undefined){check[3]=backdata[3].tracks.data[0].url}
				console.log(m+"search: " + Date());
				//console.log(KeyArray);
				//console.log(k+":"+search[0]);
				var  options = {
					"method": "GET",
					"hostname": "api.kkbox.com",
					"port": null,
					"path": "/v1.1/search?q="+encodeURI(thename[m])+"&type=track&territory=TW&offset=0&limit=1",
					"headers": {
					"accept": "application/json",
					"authorization": "Bearer A+1EPoA+f0ZAhz1Q+fh67w=="
					}
				};

				var req = https.request(options, function (res) {
				  var chunks = [];
				  res.on("data", function (chunk) {
					chunks.push(chunk);
				  });
				  res.on("end", function () {
					var body = Buffer.concat(chunks);
					backdata[m-endtime+4]=(JSON.parse(body.toString()));
					if(thename[m+1]==undefined){
						if(backdata[m-endtime+4]==undefined||backdata[m-endtime+4].tracks==undefined||backdata[m-endtime+4].tracks.data[0]==undefined||backdata[m-endtime+4].tracks.data[0].url==check[0]||backdata[m-endtime+4].tracks.data[0].url==check[1]||backdata[m-endtime+4].tracks.data[0].url==check[2]||backdata[m-endtime+4].tracks.data[0].url==check[3]){
							backdata[m-endtime+4]=undefined;
						}
						rep.send(backdata);
						  var finishtime=Date();
						  console.log(sttime+"NODONE!"+finishtime);
					}
					else if(backdata[m-endtime+4]==undefined||backdata[m-endtime+4].tracks==undefined||backdata[m-endtime+4].tracks.data[0]==undefined||backdata[m-endtime+4].tracks.data[0].url==check[0]||backdata[m-endtime+4].tracks.data[0].url==check[1]||backdata[m-endtime+4].tracks.data[0].url==check[2]||backdata[m-endtime+4].tracks.data[0].url==check[3]){
						backdata[m-endtime+4]=undefined;
						console.log("<<<<<<<<<<<<<<<<<<<<<抓到了>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>");
						getdata(m+1,endtime+1);
					}
					else{
		if(backdata[m-endtime+4].tracks.data[0].album.release_date==undefined){
			backdata[m-endtime+4]=undefined;
			console.log("<老到沒日子>");
			getdata(m+1,endtime+1);
		}
		else{
			console.log(backdata[m-endtime+4].tracks.data[0].album.release_date.slice(0,4));
			var theyear=parseInt(backdata[m-endtime+4].tracks.data[0].album.release_date.slice(0,4));
			console.log(theyear<2010);
			if(theyear<2010){
				
				backdata[m-endtime+4]=undefined;
				console.log("<太老了>");
				getdata(m+1,endtime+1);
			}
			else{
				if(m==endtime){
				  rep.send(backdata);
				  var finishtime=Date();
				  console.log(sttime+"DONE!"+finishtime);
				}
				else{
				  getdata(m+1,endtime);
				}
			}
		}
	}
				 });
				});
				req.end();
			}
			getdata(0,4);
          }
        },timeout);
      });
    }
	var uselessthings=thefinish(1000);
}
else{

  //var txtfile = "./wiki_zh_tw.txt"; 
  //var txtdata = require(txtfile),
var whichdata='chinese_boysong';
var fs = require('fs');
fs.writeFile("./public/python/wiki_zh_tw.txt", red.body.userinput, function(err) {
      if(err) {
                return console.log(err);
                    }
      else{
          console.log("The file was saved!");	

/*var options = {
      mode: 'json',
      pythonOptions: ['-u'],
      scriptPath: './',
};*/

PythonShell.run('./public/python/segment.py', function (err) {
    if(err) {
		console.log(err);
	}
    //else {
fs.readFile("./public/python/wiki_seg.txt","utf8", (err, data) => {
    if (err) throw err;
    var NewArray = new Array();
    var KeyArray = new Array();
    var NewArray = data.split(" ");
//    console.log(NewArray);
    console.log(NewArray.length);
    
 function find(k){
var i;
var undenum=0;
var yesdenum=0;
var undenuma=0;
var yesdenuma=0;
var datafinish=0;
var donefinish=0;
var endfinish=0;
var HashMap={};
var NameMap={};
var Namearray=[];
var namenum=0;
datad(k);
datac(k);
datab(k);
dataa(k);
function dataa(p){
	var chg = 0;
	if(NewArray[p]==""){
		//KeyArray[p].name=NewArray[p];
		if(p!=0){datafinish+=1;dataa(p-1);}
		else{datafinish+=1;
		console.log("以空格結束"+Date());}
	}
	else{
    //if (k==0){
    // console.log("Connected!!!!!");
    con.query("SELECT `id` , `name` FROM `chinese_boysong` WHERE synonym LIKE '%"+NewArray[p]+"%'", function (err, result, fields) {
    if (err) throw err ;
       if(result[0]==undefined){
         undenuma+=1;
		 KeyArray.push({value:-1, name:NewArray[p]})
         if(p!=0){datafinish+=1; dataa(p-1);console.log(NewArray[p]+"無關鍵");}
		 //else{datafinish+=1;}
		 else{
			 datafinish+=1;
			 console.log("以無關鍵字結束"+Date());
			}
       }
       else{
		   yesdenuma+=1;
		   getkey(0);
		   if(p!=0){dataa(p-1)};
		}
	//  console.log("IMIN")
	
	function getkey(num){
		var nameword = result[num].name;
        if(HashMap[result[num].id]==undefined){
			//if((Namearray.indexOf(nameword))==-1){
				HashMap[result[num].id]=parseInt(red.body.sypoint);				
			//	Namearray[namenum]=nameword;
				NameMap[result[num].id]=nameword;
				namenum+=1;
				chg+=1;
				
			//console.log("INOUT"+chg);
			//console.log("Namearray");
			//console.log(Namearray);
			//console.log((Namearray.indexOf(nameword))+Namearray+result[num].name+nameword);
			//}
			//else{chg+=1;}
		}
		//else if(NameMap[result[num].id]=result[num].name){
			
		//}
		else{
			HashMap[result[num].id]+=parseInt(red.body.sypoint);
			chg+=1;
			//console.log("ININ"+chg);
		}
		if(result[num+1]!=undefined){
			setTimeout(()=>{getkey(num+1);},0.01);
			//console.log(num+"ININ"+chg);
		}
		else{
			var numpl=num+1;
			var anything = wait(100);
			async function wait(timeout){
				return new Promise((resolve)=>{
					setTimeout(()=>{
						if (chg!=numpl){
							resolve(wait(100));
							console.log(NewArray[p]+"syPPP"+numpl+"");
						}
						else {
							datafinish+=1;
							resolve(1);
							console.log(NewArray[p]+"sydone");
						};
					},timeout);
				});
			}
		}	
	}
});

}
}
function datab(p){
	 console.log(NewArray[p]+"進來了"+p);
	var chg = 0;
	if(NewArray[p]==""){
		//KeyArray[p].name=NewArray[p];
		if(p!=0){datab(p-1);datafinish+=1;}
		else{datafinish+=1;}
	}
	else{
    //if (k==0){
    // console.log("Connected!!!!!");
    con.query("SELECT `id` , `name` FROM `chinese_boysong` WHERE keyword LIKE '%"+NewArray[p]+"%'", function (err, result, fields) {
    if (err) throw err ;
       if(result[0]==undefined){
         undenum+=1;
		 KeyArray.push({value:-1,name:NewArray[p]})
         if(p!=0){datab(p-1);datafinish+=1;console.log(NewArray[p]+"nokey");}
		 //else{datafinish+=1;}
		 else{
			 datafinish+=1;
			 console.log(NewArray[p]+"nokey");
			}
       }
       else{
		   console.log(NewArray[p]+":有關鍵"+red.body.sypoint);
		   yesdenum+=1;
		   getkey(0);
		   if(p!=0){datab(p-1)};	
		}
	//  console.log("IMIN")
	function getkey(num){
		var nameword = result[num].name;
        if(HashMap[result[num].id]==undefined){
			//if((Namearray.indexOf(nameword))==-1){
				HashMap[result[num].id]=parseInt(red.body.keypoint);				
			//	Namearray[namenum]=nameword;
				NameMap[result[num].id]=nameword;
				namenum+=1;
				chg+=1;
			//console.log((Namearray.indexOf(nameword))+Namearray+result[num].name+nameword);
			//}
			//else{chg+=1;}
		}
		//else if(NameMap[result[num].id]=result[num].name){
			
		//}
		else{
			HashMap[result[num].id]+=parseInt(red.body.keypoint);
			chg+=1;
		}
		if(result[num+1]!=undefined){
			//console.log(NewArray[p]+"1不對"+num) 
			setTimeout(()=>{getkey(num+1);},0.01);
		}
		else{
			//console.log("我覺得你喜歡這趟旅程"+num) 
			var numpl=num+1;
			var anything=wait(100);
			async function wait(timeout){
				return new Promise((resolve)=>{
					setTimeout(()=>{
						if (chg!=numpl){
							resolve(wait(1000));
							//console.log(NewArray[p]+"keyPPP"+numpl+"cg:"+chg+""+HashMap[result[chg-1].id]);
						}
						else {
							datafinish+=1;
							resolve(1);
							console.log(NewArray[p]+"keydone"+datafinish);
						};
					},timeout);
				});
			}
		}	
	}
});

}
}
function datac(p){
	var chg = 0;
	if(NewArray[p]==""){
		//KeyArray[p].name=NewArray[p];
		if(p!=0){datafinish+=1;datac(p-1);}
		else{datafinish+=1;
		console.log("以空格結束"+Date());}
	}
	else{
    //if (k==0){
    // console.log("Connected!!!!!");
    con.query("SELECT `id` , `name` FROM `chinese_girlsong` WHERE synonym LIKE '%"+NewArray[p]+"%'", function (err, result, fields) {
    if (err) throw err ;
       if(result[0]==undefined){
         undenuma+=1;
		 KeyArray.push({value:-1, name:NewArray[p]})
         if(p!=0){datafinish+=1; datac(p-1);console.log(NewArray[p]+"無關鍵");}
		 //else{datafinish+=1;}
		 else{
			 datafinish+=1;
			 console.log("以無關鍵字結束"+Date());
			}
       }
       else{
		   yesdenuma+=1;
		   getkey(0);
		   if(p!=0){datac(p-1)};
		}
	//  console.log("IMIN")
	
	function getkey(num){
		var nameword = result[num].name;
        if(HashMap[result[num].id]==undefined){
			//if((Namearray.indexOf(nameword))==-1){
				HashMap[result[num].id]=parseInt(red.body.sypoint);				
			//	Namearray[namenum]=nameword;
				NameMap[result[num].id]=nameword;
				namenum+=1;
				chg+=1;
				
			//console.log("INOUT"+chg);
			//console.log("Namearray");
			//console.log(Namearray);
			//console.log((Namearray.indexOf(nameword))+Namearray+result[num].name+nameword);
			//}
			//else{chg+=1;}
		}
		//else if(NameMap[result[num].id]=result[num].name){
			
		//}
		else{
			HashMap[result[num].id]+=parseInt(red.body.sypoint);
			chg+=1;
			//console.log("ININ"+chg);
		}
		if(result[num+1]!=undefined){
			setTimeout(()=>{getkey(num+1);},0.01);
			//console.log(num+"ININ"+chg);
		}
		else{
			var numpl=num+1;
			var anything = wait(100);
			async function wait(timeout){
				return new Promise((resolve)=>{
					setTimeout(()=>{
						if (chg!=numpl){
							resolve(wait(100));
							console.log(NewArray[p]+"syPPP"+numpl+"");
						}
						else {
							datafinish+=1;
							resolve(1);
							console.log(NewArray[p]+"sydone");
						};
					},timeout);
				});
			}
		}	
	}
});

}
}
function datad(p){
	 console.log(NewArray[p]+"進來了"+p);
	var chg = 0;
	if(NewArray[p]==""){
		//KeyArray[p].name=NewArray[p];
		if(p!=0){datad(p-1);datafinish+=1;}
		else{datafinish+=1;}
	}
	else{
    //if (k==0){
    // console.log("Connected!!!!!");
    con.query("SELECT `id` , `name` FROM `chinese_girlsong` WHERE keyword LIKE '%"+NewArray[p]+"%'", function (err, result, fields) {
    if (err) throw err ;
       if(result[0]==undefined){
         undenum+=1;
		 KeyArray.push({value:-1,name:NewArray[p]})
         if(p!=0){datad(p-1);datafinish+=1;console.log(NewArray[p]+"nokey");}
		 //else{datafinish+=1;}
		 else{
			 datafinish+=1;
			 console.log(NewArray[p]+"nokey");
			}
       }
       else{
		   console.log(NewArray[p]+":有關鍵"+red.body.sypoint);
		   yesdenum+=1;
		   getkey(0);
		   if(p!=0){datad(p-1)};	
		}
	//  console.log("IMIN")
	function getkey(num){
		var nameword = result[num].name;
        if(HashMap[result[num].id]==undefined){
			//if((Namearray.indexOf(nameword))==-1){
				HashMap[result[num].id]=parseInt(red.body.keypoint);				
			//	Namearray[namenum]=nameword;
				NameMap[result[num].id]=nameword;
				namenum+=1;
				chg+=1;
			//console.log((Namearray.indexOf(nameword))+Namearray+result[num].name+nameword);
			//}
			//else{chg+=1;}
		}
		//else if(NameMap[result[num].id]=result[num].name){
			
		//}
		else{
			HashMap[result[num].id]+=parseInt(red.body.keypoint);
			chg+=1;
		}
		if(result[num+1]!=undefined){
			//console.log(NewArray[p]+"1不對"+num) 
			setTimeout(()=>{getkey(num+1);},0.01);
		}
		else{
			//console.log("我覺得你喜歡這趟旅程"+num) 
			var numpl=num+1;
			var anything=wait(100);
			async function wait(timeout){
				return new Promise((resolve)=>{
					setTimeout(()=>{
						if (chg!=numpl){
							resolve(wait(1000));
							//console.log(NewArray[p]+"keyPPP"+numpl+"cg:"+chg+""+HashMap[result[chg-1].id]);
						}
						else {
							datafinish+=1;
							resolve(1);
							console.log(NewArray[p]+"keydone"+datafinish);
						};
					},timeout);
				});
			}
		}	
	}
});

}
}

//return KeyArray;

var times=k*4+4;
    async function finish(timeout){
      return new Promise((resolve)=>{
        setTimeout(()=>{
			//console.log(k+"/"+datafinish+"/"+endfinish+"/"+donefinish);
          if (datafinish<times){
            resolve(finish(100));
           //console.log(NewArray.length+"DA"+datafinish);
          }
		  else if (endfinish==0){
			endfinish=1;
			for (var key in HashMap) {
				KeyArray.push({
					id: key,
					value: HashMap[key],
					name: NameMap[key]
				});
				//console.log(KeyArray);
			}
			KeyArray=KeyArray.sort(function (a, b) {
				
				return a.value < b.value ? 1 : -1;
				}); 
				donefinish=1;
			resolve(finish(100));
		  }
		  else if (donefinish==0){
			 resolve(finish(100));
		  }
          else{
			//console.log(KeyArray);
            resolve("A");
			console.log("排序結束"+Date());
          }
        },timeout);
      });
    }
	return finish(100);
}
var backdata=[]; 
async function run() {
  var dt = new Date();
  console.log(NewArray+"Before: "+  dt);
  let search  = await find(NewArray.length-1);
  if(KeyArray[0]==undefined){rep.send("查無匹配歌曲");}
  else{getdata(0,4);}
}
 
run();

var check=[];
function getdata(m,endtime){
if((m-endtime+4)==1&&backdata[0]!=undefined){check[0]=backdata[0].tracks.data[0].url}
if((m-endtime+4)==2&&backdata[1]!=undefined){check[1]=backdata[1].tracks.data[0].url}
if((m-endtime+4)==3&&backdata[2]!=undefined){check[2]=backdata[2].tracks.data[0].url}
if((m-endtime+4)==4&&backdata[3]!=undefined){check[3]=backdata[3].tracks.data[0].url}
console.log(m+"search: " + Date());
//console.log(KeyArray);
//console.log(k+":"+search[0]);
var  options = {
    "method": "GET",
    "hostname": "api.kkbox.com",
    "port": null,
    "path": "/v1.1/search?q="+encodeURI(KeyArray[m].name)+"&type=track&territory=TW&offset=0&limit=1",
    "headers": {
    "accept": "application/json",
    "authorization": "Bearer A+1EPoA+f0ZAhz1Q+fh67w=="
    }
};
process.on('uncaughtException', function(err) {
	rep.send(backdata);
	console.log(backdata);
	throw err;
});
var req = https.request(options, function (res) {
  var chunks = [];
  res.on("data", function (chunk) {
    chunks.push(chunk);
  });
  res.on("end", function () {
    var body = Buffer.concat(chunks);
    backdata[m-endtime+4]=(JSON.parse(body.toString()));
	if(KeyArray[m+1]==undefined){
		if(backdata[m-endtime+4]==undefined||backdata[m-endtime+4].tracks.data[0]==undefined||backdata[m-endtime+4].tracks.data[0].url==check[0]||backdata[m-endtime+4].tracks.data[0].url==check[1]||backdata[m-endtime+4].tracks.data[0].url==check[2]||backdata[m-endtime+4].tracks.data[0].url==check[3]){
			backdata[m-endtime+4]=undefined;
		}
		rep.send(backdata);
		  var finishtime=Date();
		  console.log(sttime+"NODONE!"+finishtime);
	}
	else if(backdata[m-endtime+4]==undefined||backdata[m-endtime+4].tracks.data[0]==undefined||backdata[m-endtime+4].tracks.data[0].url==check[0]||backdata[m-endtime+4].tracks.data[0].url==check[1]||backdata[m-endtime+4].tracks.data[0].url==check[2]||backdata[m-endtime+4].tracks.data[0].url==check[3]){
		backdata[m-endtime+4]=undefined;
		console.log("<<<<<<<<<<<<<<<<<<<<<抓到了>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>");
		getdata(m+1,endtime+1);
	}
	else{
		if(backdata[m-endtime+4].tracks.data[0].album.release_date==undefined){
			backdata[m-endtime+4]=undefined;
			console.log("<老到沒日子>");
			getdata(m+1,endtime+1);
		}
		else{
			console.log(backdata[m-endtime+4].tracks.data[0].album.release_date.slice(0,4));
			var theyear=parseInt(backdata[m-endtime+4].tracks.data[0].album.release_date.slice(0,4));
			console.log(theyear<2010);
			if(theyear<2010){
				
				backdata[m-endtime+4]=undefined;
				console.log("<太老了>");
				getdata(m+1,endtime+1);
			}
			else{
				if(m==endtime){
				  rep.send(backdata);
				  var finishtime=Date();
				  console.log(sttime+"DONE!"+finishtime);
				}
				else{
				  getdata(m+1,endtime);
				}
			}
		}
	}
 });
});
req.end();
}
});
//}
});
}
});
/*require("jsdom/lib/old-api").env("", function(err, window) {
      if (err) {
                console.error(err);
                        return;
                            }
var $ = require('jquery')(window); 
$.ajax({
    type: "POST",
    url: "./public/python/segment.py",
}).done(function( o ) {
     
});
});*/
}
});
})

