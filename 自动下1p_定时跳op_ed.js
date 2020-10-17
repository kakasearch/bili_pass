// ==UserScript==
// @name        bili-pass
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description   B站跳过片头片尾，自动播放下一p
// @author       kakasearch
// @match         *://www.bilibili.com/*
// @connect      aip.baidubce.com
// @connect      localhost
// @connect      127.0.0.1
// @grant        GM_getValue
// @grant         GM_setValue
// @grant			GM_addStyle
// @grant           GM_xmlhttpRequest
// @run-at       document-end
// ==/UserScript==
function info(){
    const arg = Array.from(arguments);
    arg.unshift(`color: white; background-color:#2274A5`);
    arg.unshift('%c bili-pass:');
    console["info"].apply(console, arg);
}

function get_data_from_local(nowep){
    //查看本地是否有
    let had_data = GM_getValue('ep_data')
    // info(had_data[nowep])
    try{
        throw 'test'
        let set_op=had_data[nowep]["set_op"]
        let set_ed=had_data[nowep]["set_ed"]
        info("读取本地信息")
        return [set_op,set_ed]
    }catch(e){
        info("本地无此信息")
        return false
    }

}


(function() {
    'use strict';
    let video
    let nextBtn
    let setting={
        auto_over:false  //为每个视频自动跳过开头结尾，默认关闭
        ,min_time:10*60  //小于此时长的视频不跳过开头结尾，单位秒，默认10min
        ,op_max_ration:0.5   //片头最大允许占比,跳过太多认为云端数据不可信，取消跳过，不影响本地设置
    }
    function initfun(){
        let init = setInterval(function(){
            video= document.querySelector("video")
            if(video){clearInterval(init) //成功进入页面，开始执行功能
                      let observer = new MutationObserver(initfun);
                      observer.observe(video,{attributes: true,childList: true,subtree: true});//检测video变化,防止中途切换失效
                      next()//自动下一p
                      if(video.duration>=setting.min_time){
                      overplay()//跳过片头片尾
                      }
                     }
        },1000)
        }
    //先实现自动下一p
    function next(){
        info('next on')
        video.addEventListener("ended",function(){
            nextBtn = document.querySelector("div.bilibili-player-video-btn.bilibili-player-video-btn-next > button")
            if(nextBtn){
                info('下1p')
                nextBtn.click()
            }
        }
                              )
    }



    ///////////////////////////////////////////////////////////////////////////////////跳过片头片尾//////////////////////////////////////////////////

    function overplay(){
        //做一个可弹出的页面，设置片头时长，片尾时长，是否共享上传
        //同一系列的设置可继承
        //检查服务器是否有相关配置，如果没有就提示无配置（不要太明显），让用户自行配置，上传设置；有就同步

        //生成按钮！！！！先空着
        let set_op=0,set_ed=0 //初始化






        let list_info = document.querySelector("#eplist_module > div.list-title.clearfix > span.ep-list-progress").innerText.split('/')
        let now_ep_no = parseInt(list_info[0])//当前观看的ep eg:5
        let all_ep_no = parseInt(list_info[1])//总的ep eg:10
        let now_ep_num = /ep(\d+)/g.exec(window.location.href) || /last_ep_id.:(\d+)/g.exec(document.body.getElementsByTagName('script')[2].innerText) //当前链接是否有ep信息，可能为ss425
            let firstep = parseInt(now_ep_num) - now_ep_no+1
            let lastep = parseInt(now_ep_num) + all_ep_no-now_ep_no

        now_ep_num = now_ep_num[1]
        //info('ok'+now_ep_num)
        let options = get_data_from_local('ep'+now_ep_num)  //local
        info('local',options)
        if(options){//有数据
            set_op=options[0]
            set_ed=options[1]
            setting.loaclflag = true
        }else{//无数据
            info('test server')

            let data  //server
            info('servering')

            GM_xmlhttpRequest({
                method: "GET",
                url:"http://localhost:8000/getop?epnum="+now_ep_num+"&firstep="+firstep+"&lastep="+lastep,
                onerror: (error) => {
                    info("网络或服务器错误");
                },
                ontimeout: (error) => {
                    info("网络超时");
                },

                onload: function(response) {
                    info('returning')
                    info(this.responseText)
                    data= JSON.parse(this.responseText)

                    info('serverdata',data)
                    if(data){
                        set_op=data['ep'+now_ep_num]["set_op"]
                        set_ed=data['ep'+now_ep_num]["set_ed"]   //本p
                        if(set_op<=setting.op_max_ration&&set_ed<setting.op_max_ration){ //数据可信
                            run()

                        }

                        GM_setValue("ep_data",data)
                        setting.localflag = true
                    }




                }
            })
        }


function local_set(op,ed){
   setting.op_start = op
    setting.ed_start = ed
    run()//用户设置的不纠错，最高优先级
    if(setting.localflag){//本地有数据，用户不满意
       // 跟新本地信息
                 let ep_data = {}
                 for(let i=0;i<all_ep;i++){
                     ep_data["ep"+(firstep+i)] = {set_op:set_op,set_ed:set_ed}
                 }
                GM_setValue("ep_data",ep_data)
                 info(ep_data)
        upload_data(ep_data)
    }




}





function upload_data(epdata){
GM_xmlhttpRequest({
                method: "POST",
                url:"http://localhost:8000/uploadep",
                data:JSON.stringify(epdata),
                onload: function(response) {
                    if(JSON.parse(this.responseText)["flag"]){
                    info('已上传')
                    }
else{
info('上传失败')
}
                }
})
                  }



        function run(){
            //执行代码  前面从服务器配置set_op,set_end
            let yestime = 2//单位s，容忍时长，这个时间阔以
            let start = setting.op_start || set_op ||0//片头结束时间
            let end = setting.ed_start || set_ed || video.duration//片尾开始时间####从上面获取
            //开始跳
            //info('片头：'+start)
            //info('片尾：'+end)
            if(video.currentTime<start-yestime){//片头跳过
                video.currentTime = start
                video.play()
                info('op跳过')
            }
            video.addEventListener("play",function(){
                nextBtn = document.querySelector("div.bilibili-player-video-btn.bilibili-player-video-btn-next > button")
                if(nextBtn){
                    //info('ed监听 on')
                    let over_end =setInterval(function(){
                        if(video.currentTime>=end){
                            clearInterval(over_end)
                            info('下1p from ed')
                            nextBtn.click()
                        }
                    },1000)

                    }else{
                        info('无下1p,取消跳过片尾')
                    }

            })


        }
    }
    setting.localflag = false
    initfun()
    // Your code here...
})();