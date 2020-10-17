// ==UserScript==
// @name         bili指挥部(精准降落)
// @namespace    http://tampermonkey.net/
// @version      1.33
// @description  查找弹幕中的"指挥部"关键词，实现自动跳过片头
// @author       kakasearch
// @include      *://www.bilibili.com/video/av*
// @include      *://www.bilibili.com/video/BV*
// @include      *://www.bilibili.com/bangumi/play/ep*
// @include      *://www.bilibili.com/bangumi/play/ss*
// @include      *://m.bilibili.com/bangumi/play/ep*
// @include      *://m.bilibili.com/bangumi/play/ss*
// @include      *://bangumi.bilibili.com/anime/*
// @include      *://bangumi.bilibili.com/movie/*
// @include      *://www.bilibili.com/bangumi/media/md*
// @include      *://www.bilibili.com/blackboard/html5player.html*
// @connect      comment.bilibili.com
// @run-at       document-end
// @grant        GM_xmlhttpRequest
// @grant        unsafeWindow
// @license      MIT
// @downloadURL none
// ==/UserScript==

/////////////////////////////////////////////bili_pass --- danmu_pass//////////////////////////////////////////////////////
(function() {
    const bili_pass_zhb = {
        setting:{
            keyword:['在.+为什么跳op','谢指挥部','精准降落','反手炸了指挥部','精准落地','感谢指路'],//含有这些关键词的进入筛选，如感谢指挥部
            badword:['呼叫','[吗呢怎了]'],//含有这些词的弹幕将被排除，例如 呼叫指挥部 或 指挥部呢？
            max_time:300,//单位秒，最大跳过时长，此时长之外的将视为不可信，0为不限制
            min_time:10,//单位秒，最小跳过时长，此时长之外的将视为不可信，0为不限制
            react_time:3,//弹幕发送的反应时间
            cid:'',//控制切p
            debug : 0,//开发模式
            auto_play:1,//是否打开页面就播放，默认为1：所有页面播放，改为0：只有换p后才会自动播放
            pass_op : 1,//记录次剧集是否跳过,不要修改
        },
        info(){//输出信息
            const arg = Array.from(arguments);
            arg.unshift(`color: white; background-color:#2274A5`);
            arg.unshift('%c bili指挥部:');
            console["info"].apply(console, arg);
        },
        btn_switch(){//指挥部开关控制
            let fill = document.querySelector("#danmu-pass-fill")
            let text = document.querySelector("#danmu-pass-text")
            let btn = document.querySelector("#danmu-pass-switch")
            if(btn .checked){
                //开
                fill.setAttribute('fill','#00A1D6')
                text.innerHTML='关闭指挥部'
                bili_pass_zhb.setting.pass_op = 1//恢复默认
            }else{
                //off
                fill.setAttribute('fill','#757575')
                text.innerHTML='开启指挥部'
                //本片所有剧集取消跳过
                bili_pass_zhb.setting.pass_op = 0
            }
        },
        add_btn(){//添加开关,文字id bili_pass_text,开关danmu-pass-switch
            let otest
            let btn
            let init_btn = setInterval(function(){
                let node=document.querySelector("div.bilibili-player-video-danmaku-root > div.bilibili-player-video-danmaku-setting")
                if(node){clearInterval(init_btn)//成功进入页面，开始执行功能
                         let checked = ''
                         if(bili_pass_zhb.setting.pass_op){//此p跳op
                             checked ='checked'}//默认开启
                         let otest = document.querySelector("div.bilibili-player-video-danmaku-root")
                         let nodestr = '<div class="bilibili-player-video-danmaku-switch bui bui-switch" ><input id="danmu-pass-switch" class="bui-switch-input" type="checkbox" '+checked+' ><label class="bui-switch-label"> <span class="bui-switch-name"></span> <span class="bui-switch-body">  <span class="bui-switch-dot"><span><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"> <text  id = "danmu-pass-fill" fill="#00A1D6" stroke="#000" stroke-width="0" stroke-opacity="null" style="pointer-events: inherit; cursor: move;" x="0" y="7" font-size="8" text-anchor="start" xml:space="preserve" stroke-dasharray="none" font-weight="bold">op</text></svg></span>  </span> </span></label><span class="choose_danmaku" id="danmu-pass-text">关闭指挥部</span></div>'
                         let newnode=document.createRange().createContextualFragment(nodestr);
                         btn = document.querySelector("#danmu-pass-switch")
                         if(btn && bili_pass_zhb.setting.debug){bili_pass_zhb.info('重复添加')} //只添加一次
                         else{
                             otest.insertBefore(newnode,node) ///添加开关节点

                         }
                         bili_pass_zhb.btn_switch()
                         try{btn.addEventListener('click',bili_pass_zhb.btn_switch)
                            }
                         catch(e){
                            // bili_pass_zhb.info('btn error',btn)
                             let init_btn_lis = setInterval(function(){
                                 if(document.querySelector("#danmu-pass-switch")){clearInterval(init_btn_lis)//成功进入页面，开始执行功能
                                                                                  document.querySelector("#danmu-pass-switch").addEventListener('click',bili_pass_zhb.btn_switch)
                                                                               // bili_pass_zhb.info('btn fixed',document.querySelector("#danmu-pass-switch"))
                                                                                 }else{bili_pass_zhb.addtn()}
                             })
                             }
                        }
            } )
            },
        load_zhb(target,key){//降落至指挥部
            let init_load = setInterval(function(){
                let video= document.querySelector("video")
                if(video){clearInterval(init_load) //video加载完毕
                          try{
                              video.currentTime = target-bili_pass_zhb.setting.react_time
                              video.play()
                              bili_pass_zhb.info('已降落至指挥部，指示词：',key)
                          }catch(e){
                              video.addEventListener('loadedmetadata',function(){
                                  if(bili_pass_zhb.setting.debug){bili_pass_zhb.info('from loadedmetadata')}
                                  bili_pass_zhb.load_zhb()
                              })
                          }
                         }
            })
            },
        found_zhb(text){//弹幕中找指挥部
            let found = 0
            let key_length = bili_pass_zhb.setting.keyword.length
            let bad_length = bili_pass_zhb.setting.badword.length
            for(let i=0;i <key_length;i++){
                let pattern1 = new RegExp( "<d p=\"(\\d+\\.\\d+),.*?\">(.*?"+bili_pass_zhb.setting.keyword[i]+".*)", "gi");
                let result = pattern1.exec(text)
                if(result){

                    let danmu = result[2]//弹幕内容
                    let bad_check = false
                    for(let k=0;k<bad_length;k++){//检查是否有无效关键词  /////////////////////////////此处可优化至上步，一并匹配
                        let pattern2 = new RegExp( bili_pass_zhb.setting.badword[k], "gi");
                        if(pattern2.exec(danmu)){
                            if(bili_pass_zhb.setting.debug){bili_pass_zhb.info('无效弹幕',danmu)}
                            bad_check = true
                        }
                    }
                    if(bad_check){continue}
                    //关键词是有效的
                    let target = Number(result[1])//指挥部所在时间
                    if((target<=bili_pass_zhb.setting.max_time&& target>=bili_pass_zhb.setting.min_time)||bili_pass_zhb.setting.max_time<=0){//指挥部可信
                        if(bili_pass_zhb.setting.debug){bili_pass_zhb.info('找到指挥部，弹幕：',result)}
                        bili_pass_zhb.load_zhb(target,bili_pass_zhb.setting.keyword[i])
                        found = 1
                        break
                    }else{
                        if(bili_pass_zhb.setting.debug){
                            bili_pass_zhb.info('指挥部不可信,如需修改，请前往setting代码出，当前跳转时长范围：',bili_pass_zhb.setting.min_time,'--',bili_pass_zhb.setting.max_time)
                            bili_pass_zhb.info(result)
                        }
                    }
                }
            }
            if(found==0){
                bili_pass_zhb.info('未找到指挥部')
                document.querySelector("video").play()
                if(bili_pass_zhb.setting.debug){bili_pass_zhb.info( text) }
            }

        },
        get_danmu(cid){//获取弹幕
            if(bili_pass_zhb.setting.debug){bili_pass_zhb.info('开始获取弹幕')}
            GM_xmlhttpRequest({
                method: 'GET',
                url: 'https://comment.bilibili.com/'+cid+'.xml',
                onload: function(xhr) {

                    if (xhr.status == 200) {
                        let text = xhr.responseText.replace(/<\/d>/g,'\n')
                        bili_pass_zhb.found_zhb(text)
                    } else {
                        bili_pass_zhb.info('获取弹幕失败')
                    }
                }
            });
        },
        initfun(from){
            bili_pass_zhb.add_btn()//加开关
            let cid
             bili_pass_zhb.info(from)
            bili_pass_zhb.info(bili_pass_zhb.setting.autoplay)

            if(from=='first_run' && bili_pass_zhb.setting.auto_play==0){
                bili_pass_zhb.info('拒绝执行')
                return
                //关闭了默认播放，且此时没切p
            }else{
                bili_pass_zhb.info('同意执行')
            let init = setInterval(function(){
                cid = unsafeWindow.cid
                if(cid){clearInterval(init) //成功进入页面，开始执行功能
                        if(cid !=bili_pass_zhb.setting.cid){//阻止无效运行
                            if(bili_pass_zhb.setting.pass_op){//开关控制是否要跳op
                                bili_pass_zhb.setting.cid = cid//保证只允行1次
                                bili_pass_zhb.get_danmu(cid)
                            }else{bili_pass_zhb.info('off')}
                        }

                       }
            },500)
            }
        }
    }
    let ci = 0
    bili_pass_zhb.initfun()
    let obser = setInterval(
    function(){
    let video= document.querySelector("#bilibili-player video")
    if(video){
        clearInterval(obser)
        let observer = new MutationObserver(()=>{if(ci == 0){ci =1;bili_pass_zhb.initfun()}else{ci =0 }})
    observer.observe(video, { attributes: true });//检测video变化,防止中途切p失效
    }

    },200
    )

    // Your code here...
})();