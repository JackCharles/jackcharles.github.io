/**
 * y = Rsin(wt + p)
 * R: 振幅
 * w: 角速度
 * p: 相位差
 */

// 单位px
var rList = [];
// 这里实际是圆周分成的份数，该值越大，角速度越小
var wList = [];
//初始相位，相对于w设置的，比如初始在第50份的角度
var pList = [];

//H5绘图相关
var drawing = document.getElementById("drawing");
var ctx = drawing.getContext("2d");
var circleMaxWidth = 0;
var frameDelay = 10;

//用于绘制三角函数的点
var sinPoint = [];
//x轴增量, 每点增加0.5px
var dx = 0.5;
//绘制周期数
var T = 2;

function draw() {
    //清空画布
    ctx.clearRect(0, 0, drawing.width, drawing.height);

    //初始化第一个圆的圆心
    var cX = circleMaxWidth + 10;
    var cY = drawing.clientHeight;

    //叠加坐标位置（最后一个圆的坐标）
    var finalX, finalY;

    //绘制所有圆
    rList.forEach((r, i) => {
        //画圆
        ctx.beginPath();
        ctx.strokeStyle = "#000000";
        ctx.arc(cX, cY, r, 0, 2 * Math.PI);
        ctx.stroke();
        ctx.closePath();

        var process = pList[i] / wList[i];
        console.log("process", process)
        var x = r * Math.cos(2 * Math.PI * process);
        var y = r * Math.sin(2 * Math.PI * process);

        ctx.beginPath();
        ctx.strokeStyle = "#FF0000";
        //画半径
        ctx.moveTo(cX, cY);
        ctx.lineTo(x + cX, y + cY);

        // 画导航线（最后一个圆的横坐标向右延申到y轴）
        if (i == rList.length - 1) {
            finalX = circleMaxWidth * 2 + 10;
            finalY = y + cY;
            ctx.moveTo(x + cX, y + cY);
            ctx.lineTo(finalX, finalY);
        }
        ctx.stroke();
        ctx.closePath();

        //更新下一个圆心
        cX += x;
        cY += y;

        //核心：更新角度，用于下周期绘制
        pList[i] = pList[i] + 1 > wList[i] ? 0 : pList[i] + 1;
    });

    //画坐标系
    ctx.beginPath();
    ctx.strokeStyle = "#000000";
    //X轴
    ctx.moveTo(circleMaxWidth + 10, drawing.clientHeight);
    ctx.lineTo(drawing.width, drawing.clientHeight);
    //Y轴
    ctx.moveTo(circleMaxWidth * 2 + 10, drawing.clientHeight - circleMaxWidth);
    ctx.lineTo(circleMaxWidth * 2 + 10, drawing.clientHeight + circleMaxWidth);
    ctx.stroke();
    ctx.closePath();

    //y轴画个点高亮一下
    ctx.beginPath();
    ctx.strokeStyle = "#2196f3";
    ctx.fillStyle = "#2196f3"
    ctx.arc(finalX, finalY, 8, 0, 2 * Math.PI, true);
    ctx.fill();
    ctx.font = '24px Arial'
    ctx.fillText(-(finalY - drawing.clientHeight), finalX + 10, finalY);
    ctx.stroke();
    ctx.closePath();

    // 画正弦曲线
    if (sinPoint.length >= T * wList[0]) {
        sinPoint.pop();
    }
    sinPoint.unshift(finalY);
    ctx.beginPath();
    ctx.strokeStyle = "#0000FF";
    for (var i = 0; i < sinPoint.length - 1; i++) {
        ctx.moveTo(finalX + i * dx, sinPoint[i]);
        ctx.lineTo(finalX + (i + 1) * dx, sinPoint[i + 1]);
    }
    ctx.stroke();
    ctx.closePath();
}


/**
 * 帧率到延时的转化
 * @param {string} f 帧率
 */
function fps2TimeDelay(f) {
    var fps = parseInt(f);
    if (isNaN(fps) || fps <= 0 || fps > 1000) {
        alert("帧率必须是1000以内的正整数");
        return -1;
    }

    return 1000 / fps;
}

/**
 * 解析振幅数据
 * @param {string} amps 振幅
 */
function amp2IntList(amps) {
    var res = [];
    amps.split("\n").forEach(s => {
        var amp = parseInt(s);
        if (isNaN(amp)) {
            alert("振幅必须是有效正整数");
            return [];
        }
        res.push(amp);
    });
    return res;
}

/**
 * 角速度帧的转换：弧度/s => 帧/周期
 * @param {string} angs 角速度
 * @param {number} fps 帧率
 */
function angularConvert(angs, fps) {
    var res = [];
    angs.split("\n").forEach(s => {
        var ang = parseFloat(s);
        if (isNaN(ang)) {
            alert("角速度必须是有效正数");
            return [];
        }

        res.push(2 * Math.PI / ang * fps);
    });
    return res;
}

/**
 * 初始相位到帧的转换：弧度 => 帧
 * @param {string} phase 初始相位
 * @param {Array} angs 周期帧数
 */
function phaseConvert(phases, angs) {
    var res = [];
    phases.split("\n").forEach((s, index) => {
        var ph = parseFloat(s);
        if (isNaN(ph) || angs[index] === undefined) {
            alert("初始相位必须是有效正数, 且数据条数与角速度一致");
            return [];
        }

        res.push(ph / (2 * Math.PI) * angs[index]);
    });
    return res;
}

/**
 * 初始化
 * @param {Array} amps 
 * @param {Array} angs 
 * @param {Array} phas 
 * @param {number} fps 
 */
function init(amps, angs, phas, fps) {

    //振幅
    var ampList = amp2IntList(amps);
    if (ampList.length === 0) {
        return false;
    }

    //帧延时
    var fd = fps2TimeDelay(fps);
    if (fd <= 0) {
        return false;
    }

    //一周期多少帧
    var angList = angularConvert(angs, parseInt(fps));
    if (angList.length === 0) {
        return false;
    }

    //初始偏移多少帧
    var phaList = phaseConvert(phas, angList);
    if (phaList.length === 0) {
        return false;
    }

    var len = ampList.length;
    if (angList.length !== len || phaList.length != len) {
        alert("振幅、角速度、初始相位数量不一致");
        return false;
    }

    rList = ampList;
    wList = angList;
    pList = phaList;
    frameDelay = fd;
    circleMaxWidth = rList.reduce((total, curr) => total += curr, 0);
    sinPoint = [];
    drawing.width = circleMaxWidth * 2 + wList[0] * T * dx + 10;
    drawing.height = circleMaxWidth * 2 + 20;
    drawing.style.height = drawing.height / 2 + "px";
    return true;
}

//页面控制部分
var timer;
function start() {
    clearInterval(timer);
    timer = setInterval("draw()", frameDelay);
}

function pausePush(x) {
    console.log(x)
    if (x.getAttribute("status") === "running") {
        clearInterval(timer);
        x.setAttribute("status", "paused");
        x.innerHTML = "播放";
    } else {
        start();
        x.setAttribute("status", "running");
        x.innerHTML = "暂停";
    }
}

function render() {
    var amps = document.getElementById("input-amp").value;
    var angs = document.getElementById("input-ang").value;
    var phas = document.getElementById("input-pha").value;
    var fps = document.getElementById("input-fps").value;
    var play = document.getElementById("draw-play");

    if (!init(amps, angs, phas, fps)) {
        return;
    }

    console.log(rList, wList, pList, frameDelay);
    clearInterval(timer);
    play.setAttribute("status", "paused");
    play.innerHTML = "播放";

    draw();
}

render();
