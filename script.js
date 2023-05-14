cog.data.db;
cog.data.dbQ;
cog.data.dbE;
cog.data.questions;
cog.data.loading = 1;
cog.data.status = null;
cog.data.inputAsk = "1";
cog.data.inputAskQ = "";
cog.data.imgSrc = "gw.jpg";

var modal = {};
modal.info = UIkit.modal("#modalInfo");
modal.info.options.bgclose = false;
modal.info.options.center = true;
modal.ask = UIkit.modal("#modalAsk");
modal.ask.options.bgclose = false;
modal.ask.options.center = true;
modal.guess = UIkit.modal("#modalGuess");
modal.guess.options.bgclose = false;
modal.guess.options.center = true;
cog.data.modalInfo = {
    loading: 1,
    img: "",
    text: "",
    callback: function() {}
}
cog.data.modalAsk = {
    loading: 1,
    question: "",
    answer: ""
}
cog.data.modalGuess = {
    loading: 1,
    question: "",
    answer: ""
}

cog.data.turn = getRand(1);
cog.data.totalChars = 24;
cog.data.youChar = getRand(cog.data.totalChars, 1);
cog.data.cpuChar = getRand(cog.data.totalChars, 1);
cog.data.cpuMemory = {};
cog.data.cpuSlots = {};
cog.alter("cpuSlots", function(){
    var i, result={};
    for(i=1;i<=cog.data.totalChars;i++) {
    result[i] = false;
    }
    return result;
});
cog.data.slots = {};
cog.alter("slots", function(){
    var i, result={};
    for(i=1;i<=cog.data.totalChars;i++) {
    result[i] = false;
    }
    return result;
});

function getRand(max, min) {
    if (min == null) {min = 0;}
    return Math.floor(Math.random() * (max - min + 1) + min);
}

getImgTile = function (arg, callback, param) {
    if (arg == null ) {return;}
    if (callback == null ) {return;}
    if (arg.src == null ) {return;}
    if (arg.col == null) {arg.col = arg.n % arg.total;}
    if (arg.row == null) {arg.row = Math.floor(arg.n / arg.total);}
    if (arg.x == null) {arg.x = 100;}
    if (arg.y == null) {arg.y = 100;}
    if (arg.w == null) {arg.w = 100;}
    if (arg.h == null) {arg.h = 100;}
    var img =  new Image();
    var canvas = document.createElement("canvas");
    var ctx = canvas.getContext("2d");
    img.crossOrigin = "anonymous";
    img.src = arg.src;
    img.onload = function () {
        canvas.width = arg.w;
        canvas.height = arg.h;
        ctx.drawImage(img, arg.col*arg.x, arg.row*arg.y, arg.x, arg.y, 0, 0, arg.w, arg.h);
        callback(canvas.toDataURL("image/png"), param);
    };

};

cog.bindAll();

init_sql();
function init_sql() {
    initSqlJs().then(function(SQL){
        cog.xhr("guesswho.db", function(xhr){
        var uInt8Array = new Uint8Array(xhr.response);
        var db = new SQL.Database(uInt8Array);
        cog.set("db", db);
        cog.set("dbQ", db.exec("select * from q"));
        cog.set("dbE", db.exec("select * from e"));
        init_chars();
        }, {type:"arraybuffer"});
    });
}
function init_chars() {
    var i = 1, key, el;
    for (key in cog.data.slots) {
        el = document.getElementById("slot-"+key);
        getImgTile({
            n: key-1,
            total: 5,
            x: 400,
            y: 600,
            w: 200,
            h: 300,
            src: cog.get("imgSrc")
        },
        function(e, el){
            el.src = e;
            if (i == cog.data.totalChars) {
                init_q();
            }
            i++;
        }, el);
    }
}
function init_q() {
    var arr = [{text:'Choose your question', value:'0'}], obj;
    for (var i = 0;i < cog.data.dbQ[0]["values"].length;i++) {
        obj = {value: cog.data.dbQ[0]["values"][i][0], text: cog.data.dbQ[0]["values"][i][1]};
        arr.push(obj);
    }
    cog.set("questions", arr);
    init_placeholder();
}
function init_placeholder() {
    getImgTile({
        n: 24,
        total: 5,
        x: 400,
        y: 600,
        w: 200,
        h: 300,
        src: cog.get("imgSrc")
    },
    function(e){
        $(".placeholder").attr('src', e);
        init_chosen();
    });
}
function init_chosen() {
    getImgTile({
        n: cog.data.youChar-1,
        total: 5,
        x: 400,
        y: 600,
        w: 200,
        h: 300,
        src: cog.get("imgSrc")
    },
    function(e){
        document.getElementById("slot-chosen").src = e;
        cog.set("loading", 0);
        start_game();
    });
}
function start_game() {
    if (cog.get("turn") == 1) {
        turn_cpu();
    }
}
function end_game() {
    cog.set("modalInfo.loading", 1);
    getImgTile({
        n: cog.data.cpuChar-1,
        total: 5,
        x: 400,
        y: 600,
        w: 200,
        h: 300,
        src: cog.get("imgSrc")
    },
    function(e){
        cog.set("modalInfo.loading", 0);
        cog.set("modalInfo.img", e);
        cog.set("modalInfo.callback", function () {
            cog.set("modalInfo.img", "");
            cog.set("modalInfo.text", "Restarting the game!");
            cog.set("modalInfo.callback", function () {
                modal.info.hide(true);
                restart_game();
            });
        });
    });
    modal.info.show();
}
function restart_game() {
    cog.set("loading", 1);
    cog.set("status", null);
    cog.set("youChar", getRand(cog.data.totalChars, 1));
    cog.set("cpuChar", getRand(cog.data.totalChars, 1));
    cog.set("cpuMemory", {});
    cog.set("turn", getRand(1));
    cog.set("modalInfo.img", "");
    cog.set("modalInfo.text", "");

    $(".character").css('opacity', 1);

    cog.alter("cpuSlots", function(){
        var i, result={};
        for(i=1;i<=cog.data.totalChars;i++) {
        result[i] = false;
        }
        return result;
    });

    cog.alter("slots", function(){
        var i, result={};
        for(i=1;i<=cog.data.totalChars;i++) {
            result[i] = false;
        }
        return result;
    });

    init_chosen();
}
function calc_slots() {
    if (cog.get("cpuMemory._count") > 0) {
        var result, query, queryPartQ = "";
        for (var key in cog.get("cpuMemory")) {
            if (cog.get("cpuMemory")[key] == "yes") {
                queryPartQ = queryPartQ+"select * from p inner join e, q on p.e_id = e.e_id and p.q_id = q.q_id where (p.q_id = "+key+" and p.yes > p.no) group by p.e_id union all ";
            } else {
                queryPartQ = queryPartQ+"select * from p inner join e, q on p.e_id = e.e_id and p.q_id = q.q_id where p.e_id not in ( select p.e_id from p inner join e, q on p.e_id = e.e_id and p.q_id = q.q_id where (p.q_id = "+key+" and p.yes > p.no) ) group by p.e_id union all ";
            }
        }
        queryPartQ = queryPartQ.substring(0, queryPartQ.length-10);
        query = format("with pqr as ( %s ) select pqr.e_id, ( round(round(count(*)*100, 2)/%d, 2) ) outer_accuracy from pqr inner join e, q on pqr.e_id = e.e_id and pqr.q_id = q.q_id group by pqr.e_id having outer_accuracy = 100 order by outer_accuracy desc", queryPartQ, cog.get("cpuMemory._count"));
        result = cog.data.db.exec(query);
        cog.alter("cpuSlots", function(){
            var i, result={};
            for(i=1;i<=cog.data.totalChars;i++) {
            result[i] = true;
            }
            return result;
        });
        for (var i = 0;i < result[0]["values"].length;i++) {
            cog.set("cpuSlots."+result[0]["values"][i][0], false);
        }
    }
}
function giveup() {
    UIkit.modal.confirm("Are you sure to give up?", function(){
        cog.set("modalInfo.loading", 0);
        cog.set("modalInfo.img", "");
        cog.set("modalInfo.text", "Restarting the game!");
        cog.set("modalInfo.callback", function () {
            modal.info.hide(true);
            restart_game();
        });
        modal.info.show();
    }, {center:true});
}
function turn_you() {
    if (cog.get("status") === null) {
        calc_slots();
        cog.set("turn", 0);
    } else {
        end_game();
    }
}
function turn_cpu() {
    if (cog.get("status") === null) {
        cog.set("inputAsk", "1");
        cog.set("turn", 1);
        cog.set("modalGuess.loading", 1);
        modal.guess.show();
        setTimeout(guess, 500);
    } else {
        end_game();
    }
}
function flipChar() {
    if ($(event.target).css('opacity') == 1) {
        cog.set("slots."+event.target.getAttribute("data-char"), true);
    } else {
        cog.set("slots."+event.target.getAttribute("data-char"), false);
    }
    $(event.target).animate({opacity:($(event.target).css('opacity')==1)?0:1});
}
function ask() {
    cog.set("modalAsk.loading", 1);
    if (cog.get("inputAsk") != "1") {
        modal.ask.show();
        setTimeout(function(){
            var query = format("select yes, no from p inner join e, q on p.e_id = e.e_id and p.q_id = q.q_id where p.e_id = %d and p.q_id = %d", cog.get("cpuChar"), cog.get("inputAsk"));
            var result = cog.data.db.exec(query);
            cog.set("modalAsk.question", cog.get("inputAskQ"));
            if (result[0] != null && result[0]["values"][0][0] > result[0]["values"][0][1]) {
                cog.set("modalAsk.answer", "YES");
            } else {
                cog.set("modalAsk.answer", "NO");
            }
            cog.set("modalAsk.loading", 0);
        }, 500);
    }
}
function guess() {
    var query, result, query2, result2, checkQ, answer;

    if (Object.keys(cog.get("cpuMemory")).length > 0) {
        var queryPartQ = "";
        var queryPartYes = "";
        var yesCount = 0;
        var queryPartNo = "";

        for (var key in cog.get("cpuMemory")) {
            queryPartQ = queryPartQ+"p.q_id != "+key+" and ";
            if (cog.get("cpuMemory")[key] == "yes") {
                queryPartYes = queryPartYes+"(p.q_id = "+key+" and p.yes > p.no) or ";
                yesCount++;
            } else {
                queryPartNo = queryPartNo+"(p.q_id = "+key+" and p.yes > p.no) or ";
            }
        }
        
        queryPartQ = queryPartQ.substring(0, queryPartQ.length-4);
        queryPartYes = queryPartYes.substring(0, queryPartYes.length-3);
        queryPartNo = queryPartNo.substring(0, queryPartNo.length-3);
        if (queryPartYes != "") {
            queryPartYes = format("and p.e_id in ( select p.e_id from p inner join e, q on p.e_id = e.e_id and p.q_id = q.q_id where %s group by p.e_id having count(*) = %d)", queryPartYes, yesCount);
        }
        if (queryPartNo != "") {
            queryPartNo = format("and p.e_id not in ( select p.e_id from p inner join e, q on p.e_id = e.e_id and p.q_id = q.q_id where %s group by p.e_id)", queryPartNo);
        }
        query = format("with entq as ( select * from p inner join e, q on p.e_id = e.e_id and p.q_id = q.q_id where %s %s %s group by p.e_id, p.q_id ), ent as ( select count(*) total from (select e_id from entq group by e_id) ) select (case when ent.total > 1 then entq.q_id else entq.e_id end) id, (case when ent.total > 1 then entq.q_title else entq.e_title end) name, (case when ent.total > 1 then (ent.total-sum(case when entq.yes > entq.no then 1 else 0 end)) else null end) max_eleminate, (case when ent.total > 1 then (sum(case when entq.yes > entq.no then 1 else 0 end)) else null end) min_eleminate from entq, ent group by (case when ent.total > 1 then q_id else e_id end) having (min_eleminate < ent.total) or (min_eleminate is null) order by min_eleminate desc, max_eleminate desc", queryPartQ, queryPartYes, queryPartNo);
        result = cog.data.db.exec(query);
    } else {
        query = "with entq as ( select * from p inner join e, q on p.e_id = e.e_id and p.q_id = q.q_id group by p.e_id, p.q_id ), ent as ( select count(*) total from (select e_id from entq group by e_id) ) select (case when ent.total > 1 then entq.q_id else entq.e_id end) id, (case when ent.total > 1 then entq.q_title else entq.e_title end) name, (case when ent.total > 1 then (ent.total-sum(case when entq.yes > entq.no then 1 else 0 end)) else null end) max_eleminate, (case when ent.total > 1 then (sum(case when entq.yes > entq.no then 1 else 0 end)) else null end) min_eleminate from entq, ent group by (case when ent.total > 1 then q_id else e_id end) having (min_eleminate < ent.total) or (min_eleminate is null) order by min_eleminate desc, max_eleminate desc";
        result = cog.data.db.exec(query);
    }
    
    if (result[0]["values"][0][2] == null) {
        cog.set("modalGuess.question", "Is your character "+result[0]["values"][0][1]+"?");
        cog.set("status", false);
        cog.set("modalInfo.text", "You lose! their character was: "+cog.get("dbE")[0]["values"][cog.data.cpuChar-1][1]);
        cog.set("modalGuess.answer", "YES");
    } else {
        cog.set("modalGuess.question", result[0]["values"][0][1]);
        checkQ = result[0]["values"][0][0];
        query2 = format("select yes, no from p inner join e, q on p.e_id = e.e_id and p.q_id = q.q_id where p.e_id = %d and p.q_id = %d", cog.get("youChar"), checkQ);
        result2 = cog.data.db.exec(query2);
        if (result2[0] != null && result2[0]["values"][0][0] > result2[0]["values"][0][1]) {
            cog.set("modalGuess.answer", "YES");
            answer = "yes";
        } else {
            cog.set("modalGuess.answer", "NO");
            answer = "no";
        }
        cog.alter("cpuMemory", function(obj){
            obj[result[0]["values"][0][0]] = answer;
            return obj;
        });
    }
    cog.set("modalGuess.loading", 0);
}
function you_guess() {
    var result = true, count = 0, key, chosen;
    for (key in cog.get("slots")) {
        if (cog.get("slots")[key] == false) {
            if (count >= 1) {
                result = false;
                break;
            } else {
                chosen = key;
                count++;
            }
        }
    }
    if (result && count == 1) {
        UIkit.modal.confirm("Are you sure to guess? You might lose the game if your guess is wrong!", function(){
            if (chosen == cog.get("cpuChar")) {
                cog.set("modalInfo.text", "You guessed it correctly! :)");
                cog.set("status", true);
            } else {
                cog.set("modalInfo.text", "You guessed it wrong! their character was: "+cog.get("dbE")[0]["values"][cog.data.cpuChar-1][1]);
                cog.set("status", false);
            }
            end_game();
        }, {center:true});
    } else {
        UIkit.modal.alert("Please left out a single character and try again!", {center:true});
    }
}
