(function(e){function k(b,a){var d=document.createElementNS("http://www.w3.org/2000/svg",b||"svg");a&&e.each(a,function(a,b){d.setAttributeNS(null,a,b)});return e(d)}e.fn.activity=function(b){this.each(function(){var a=e(this),d=a.data("activity");d&&(clearInterval(d.data("interval")),d.remove(),a.removeData("activity"));if(!1!==b){b=e.extend({color:a.css("color")},e.fn.activity.defaults,b);var d=m(a,b).css("position","absolute").prependTo(b.outside?"body":a),c=a.outerHeight()-d.height(),f=a.outerWidth()-
d.width(),c="top"==b.valign?b.padding:"bottom"==b.valign?c-b.padding:Math.floor(c/2),f="left"==b.align?b.padding:"right"==b.align?f-b.padding:Math.floor(f/2),g=a.offset();b.outside?d.css({top:g.top+"px",left:g.left+"px"}):(c-=d.offset().top-g.top,f-=d.offset().left-g.left);d.css({marginTop:c+"px",marginLeft:f+"px"});h(d,b.segments,Math.round(10/b.speed)/10);a.data("activity",d)}});return this};e.fn.activity.defaults={segments:12,space:3,length:7,width:4,speed:1.2,align:"center",valign:"center",padding:4};
e.fn.activity.getOpacity=function(b,a){var d=b.steps||b.segments-1,c=void 0!==b.opacity?b.opacity:1/d;return 1-Math.min(a,d)*(1-c)/d};var m=function(){return e("<div>").addClass("busy")},h=function(){};if(document.createElementNS&&document.createElementNS("http://www.w3.org/2000/svg","svg").createSVGRect)if(m=function(b,a){for(var d=2*a.width+a.space,c=d+a.length+Math.ceil(a.width/2)+1,f=k().width(2*c).height(2*c),g=k("g",{"stroke-width":a.width,"stroke-linecap":"round",stroke:a.color}).appendTo(k("g",
{transform:"translate("+c+","+c+")"}).appendTo(f)),l=0;l<a.segments;l++)g.append(k("line",{x1:0,y1:d,x2:0,y2:d+a.length,transform:"rotate("+360/a.segments*l+", 0, 0)",opacity:e.fn.activity.getOpacity(a,l)}));return e("<div>").append(f).width(2*c).height(2*c)},void 0!==document.createElement("div").style.WebkitAnimationName)var n={},h=function(b,a,d){if(!n[a]){for(var c="spin"+a,f="@-webkit-keyframes "+c+" {",e=0;e<a;e++)var l=Math.round(1E5/a*e)/1E3,k=Math.round(1E5/a*(e+1)-1)/1E3,h="% { -webkit-transform:rotate("+
Math.round(360/a*e)+"deg); }\n",f=f+(l+h+k+h);document.styleSheets[0].insertRule(f+"100% { -webkit-transform:rotate(100deg); }\n}");n[a]=c}b.css("-webkit-animation",n[a]+" "+d+"s linear infinite")};else h=function(b,a,d){var c=0,e=b.find("g g").get(0);b.data("interval",setInterval(function(){e.setAttributeNS(null,"transform","rotate("+ ++c%a*(360/a)+")")},1E3*d/a))};else{var p=e("<shape>").css("behavior","url(#default#VML)").appendTo("body");if(p.get(0).adj){var q=document.createStyleSheet();e.each(["group",
"shape","stroke"],function(){q.addRule(this,"behavior:url(#default#VML);")});m=function(b,a){for(var d=2*a.width+a.space,c=2*(d+a.length+Math.ceil(a.width/2)+1),f=-Math.ceil(c/2),f=e("<group>",{coordsize:c+" "+c,coordorigin:f+" "+f}).css({top:f,left:f,width:c,height:c}),g=0;g<a.segments;g++)f.append(e("<shape>",{path:"m "+d+",0  l "+(d+a.length)+",0"}).css({width:c,height:c,rotation:360/a.segments*g+"deg"}).append(e("<stroke>",{color:a.color,weight:a.width+"px",endcap:"round",opacity:e.fn.activity.getOpacity(a,
g)})));return e("<group>",{coordsize:c+" "+c}).css({width:c,height:c,overflow:"hidden"}).append(f)};h=function(b,a,d){var c=0,e=b.get(0);b.data("interval",setInterval(function(){e.style.rotation=++c%a*(360/a)},1E3*d/a))}}e(p).remove()}})(jQuery);
