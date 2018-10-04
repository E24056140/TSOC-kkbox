( function(d, s, id){
  var js, fjs = d.getElementsByTagName(s)[0];
  if (d.getElementById(id)) {return;}
  js = d.createElement(s); js.id = id;
  js.src = "//connect.facebook.net/en_US/sdk.js";
  fjs.parentNode.insertBefore(js, fjs);
}
(document, 'script', 'facebook-jssdk'));

function statusChangeCallback(response) {
  console.log('statusChangeCallback');
  console.log(response);
  if(response.status === 'connected'){
    console.log('connected');
  }
  else{
    console.log('user not authorized');
  }
}
function checkLoginState() {
  FB.getLoginStatus(function(response) {
    statusChangeCallback(response);
  });
}

window.fbAsyncInit = function() {
  FB.init({
    appId: '493075584474040',
    cookie: true,
    xfbml: true,
    version: 'v2.8'
  });
  
 // FB.getLoginStatus(function(response) {
 //     statusChangeCallback(response);
 //   });

FB.Event.subscribe('auth.authResponseChange', function(response){
  if (response.status === 'connected'){
    console.log('authResponse changed to connected');
    console.log('accessToken'+response.authResponse.accessToken);
    console.log('id'+response.authResponse.userID);//id
    var id = response.authResponse.userID;
    //console.log(response.authReaponse.use)
    FB.api('/me?fields=friends,name,email,picture', function(response){
      //console.log("名字:"+response.friends.data[0].name);
      //console.log("這是大頭貼:https://graph.facebook.com/"+response.id+"/picture?type=large"); 
      console.log("friend"+response.friends.data[0]);
      //console.log(response.friends.Array);
      //console.log(response.friends.data.length);
      }
    );
    FB.api(
        "/me/feed?limit=999",
        function (response) {
          if (response && !response.error) {
            console.log(response.data[2]);
            console.log(response.data[2].message);
          }
        }
    );
    //window.top.location = 'Home/';
  }
});
};
var kkboxurl=[];
var kkboxurlb=[];
var kkboxurls=[];
var intext;
var output="";
function getsends(num){
  send(kkboxurls[num]);
}
function getsend(num,total,howlong){
  send(kkboxurl[num]);

  var endmatch=0;
  var yesmatch=0;
  var i;
  for(i=0;i<total;i++){
    if(kkboxurl[num]==kkboxurlb[i]){
      endmatch=1;
      yesmatch=1;
    }
    else if(i==total-1){
      endmatch=1;
    }
  }
  finish(100);
  async function finish(timeout){
  return new Promise((resolve)=>{
    setTimeout(()=>{
      if (endmatch==0){
        finish(100);
        console.log("0.1秒過去了");
      }
      else{
        console.log("AKA:"+yesmatch);
        if(yesmatch==0){
          $.ajax({
            type: "post",
            url: "./count",
            data:{
              which:'keyword',
			  howlong: howlong,
            },
          })
        }
      }},timeout);
  });
  }

}
function getbsend(num,total,howlong){
  send(kkboxurlb[num]);
  var endmatch=0;
  var yesmatch=0;
  var i;
  for(i=0;i<total;i++){
    if(kkboxurlb[num]==kkboxurl[i]){
      endmatch=1;
      yesmatch=1;
    }
    else if(i==total-1){
      endmatch=1;
    }
  }
  finish(100);
  async function finish(timeout){
  return new Promise((resolve)=>{
    setTimeout(()=>{
      if (endmatch==0){
        finish(100);
        console.log("0.1秒過去了");
      }
      else{
        console.log("AKA:"+yesmatch);
        if(yesmatch==0){
          $.ajax({
            type: "post",
            url: "./count",
            data:{
              which:'doc2bow',
			  howlong:howlong,
            },

        })
      }
      }},timeout);
  });
  }


}

function send(url) {	
   FB.ui({
    method: 'feed',
    link: url,
    name:'012162551758864338.jpg',
    description: 'aka',
    caption: 'An example caption',
   }, function(response){});
}
function login() {
	FB.login(function(response) {
        // handle the response
        statusChangeCallback(response);
        //console.log(response.authReaponse.use)
        console.log("Response goes here!");
        if (response.authResponse) {
             //同意授權並且登入執行這段
        }
        else { 
            alert("須同意應用程式才能進入此頁面");//不同意此應用程式
        }
	}, {scope: ['email','user_friends','user_posts']});            
}
function searchsong(){
	document.getElementById("success3").innerHTML="<img src='30.svg'>";
	$.ajax({
        type: "post",
        url: "./search",
        data:{
            word:$('.container-1 input[id="search"]').val(),
        },
		success: function(data){
			document.getElementById("success3").innerHTML="";
			for(k=0;k<3;k++){
				console.log(data);
				if(data.tracks.data[k]==undefined){
					if(k==0){
						document.getElementById("success1").innerHTML+="<div>查無匹配歌曲</div>" ;
					}
				}
				else{
					document.getElementById("success3").innerHTML+="<div onclick= 'getsends("+k+")'><img src='"+data.tracks.data[k].album.images[0].url+"'>"+data.tracks.data[k].name+"</div>";
					kkboxurls[k]=(data.tracks.data[k].url);
				}
			}
		}
    })
}
$(document).ready(function(){
 $("#input button").click(function(e){
	 document.getElementById("success1").innerHTML="";
	var wordlong=$('#input textarea[name="text"]').val().length;
	
	var retryLimit = 3;
	var tryCount = 0;
    e.preventDefault();
	document.getElementById("response").innerHTML="點選歌曲後 於跳出方框中貼上(Ctrl+c) 即可發布貼文";

	document.getElementById("success").innerHTML="<img src='30.svg'>"
   /*  $.ajax({
      type: "post",
      url: "./ajax_post",
      data:{
		method:"doc2bow",
        userinput:$('#input textarea[name="text"]').val(),
        database:'chinese_girlsong',
		keypoint:'10',
		sypoint:'3'
      },
      success: function(data){
       //document.getElementById("success1").innerHTML="";
       var empty=0;
        for (k=0;k<data.length;k++){
          if(data[k]==undefined||data[k].tracks==undefined||data[k].tracks.data[0]==undefined){
            empty+=1;
            if(empty==data.length){
              document.getElementById("success1").innerHTML+="<div>查無匹配歌曲</div>" 
            }
          }
          else{
	      document.getElementById("success1").innerHTML+="<div onclick= 'getbsend("+k+","+data.length+","+wordlong+")'><img src='"+data[k].tracks.data[0].album.images[0].url+"'>"+data[k].tracks.data[0].name+"</div>";
            kkboxurlb[k]=(data[k].tracks.data[0].url);
          }
        }
      }
    })
	//<iframe width='300' height='100' src='https://widget.kkbox.com/v1/?id="+data[k].tracks.data[0].id+"&amp;type=song&amp;terr=tw&amp;lang=tc' frameborder='0' scrolling='no'></iframe>
	*/
     $.ajax({
      type: "post",
      url: "./ajax_post",
      data:{
	method:"keyword",
        userinput:$('#input textarea[name="text"]').val(),
        wordlong:wordlong,
	keypoint:'10',
	sypoint:'3'
      },
      success: function(data){
       document.getElementById("success").innerHTML="";
	   document.getElementById("success1").innerHTML="";
       var empty=0;
        for (k=0;k<data.length;k++){
          if(data[k]==undefined||data[k].tracks==undefined||data[k].tracks.data[0]==undefined){
            empty+=1;
            if(empty==data.length){
              document.getElementById("success").innerHTML+="<div>查無匹配歌曲</div>" 
            }
          }
          else{
            document.getElementById("success").innerHTML+="<div onclick= 'getsend("+k+","+data.length+","+wordlong+")'><img src='"+data[k].tracks.data[0].album.images[0].url+"'>"+data[k].tracks.data[0].name+"</div>";
            kkboxurl[k]=(data[k].tracks.data[0].url);
          }
		  if(k==data.length-1){
			  document.getElementById("success1").innerHTML+="<div>找不到想要的歌嗎?</div><div class='container-1'><img class='searchimg' src='search.svg'onclick='searchsong()'></img>  <input type='search' id='search' placeholder='搜尋歌曲'>  </div><div id='success3'></div>"
		  }
        }
      },
	  error : function(xhr, textStatus, errorThrown ) {
            this.tryCount++;
            if (this.tryCount <= this.retryLimit) {
                console.log("try again"+tryCount)
                $.ajax(this);
            }
	  }
    })
//<iframe width='300' height='100' src='https://widget.kkbox.com/v1/?id="+data[k].tracks.data[0].id+"&amp;type=song&amp;terr=tw&amp;lang=tc' frameborder='0' scrolling='no'></iframe>
        intext = $('#input textarea[name="text"]').val();
        var clip_area = document.createElement('textarea');
        clip_area.textContent = intext;

        document.body.appendChild(clip_area);
        clip_area.select();
                  
        document.execCommand('copy');
        clip_area.remove();

  })
})


