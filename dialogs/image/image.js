/**
 * User: Jinqn
 * Date: 14-04-08
 * Time: 下午16:34
 * 上传图片对话框逻辑代码,包括tab: 远程图片/上传图片/在线图片/搜索图片
 */

(function () {

    var remoteImage,
        uploadImage;

    window.onload = function () {
        init();
        initAlign();
        initButtons();
    };

    function init() {
        setAlign(editor.getOpt('imageInsertAlign'));
        uploadImage = uploadImage || new UploadImage('queueList');
    }

    /* 初始化tab标签 */
    // function initTabs() {
    //     var tabs = $G('tabhead').children;
    //     for (var i = 0; i < tabs.length; i++) {
    //         domUtils.on(tabs[i], "click", function (e) {
    //             var target = e.target || e.srcElement;
    //             setTabFocus(target.getAttribute('data-content-id'));
    //         });
    //     }
    //     setTabFocus('remote');
    // }

    /* 初始化tabbody */
    // function setTabFocus(id) {
    //     if(!id) return;
    //     var i, bodyId, tabs = $G('tabhead').children;
    //     for (i = 0; i < tabs.length; i++) {
    //         bodyId = tabs[i].getAttribute('data-content-id');
    //         if (bodyId == id) {
    //             domUtils.addClass(tabs[i], 'focus');
    //             domUtils.addClass($G(bodyId), 'focus');
    //         } else {
    //             domUtils.removeClasses(tabs[i], 'focus');
    //             domUtils.removeClasses($G(bodyId), 'focus');
    //         }
    //     }
    //     switch (id) {
    //         case 'remote':
    //             uploadImage = uploadImage || new UploadImage('queueList');
    //             remoteImage = remoteImage || new RemoteImage();
    //             break;
    //         case 'upload':
    //             setAlign(editor.getOpt('imageInsertAlign'));
    //             uploadImage = uploadImage || new UploadImage('queueList');
    //             break;
    //     }
    // }

    /* 初始化onok事件 */
    function initButtons() {
        dialog.onok = function () {
            const list = uploadImage.getQueueList();
            if(list) {
                editor.execCommand('insertimage', list);
            }
        };
    }


    /* 初始化对其方式的点击事件 */
    function initAlign(){
        /* 点击align图标 */
        domUtils.on($G("alignIcon"), 'click', function(e){
            var target = e.target || e.srcElement;
            if(target.className && target.className.indexOf('-align') != -1) {
                setAlign(target.getAttribute('data-align'));
            }
        });
    }

    /* 设置对齐方式 */
    function setAlign(align){
        align = align || 'none';
        var aligns = $G("alignIcon").children;
        for(i = 0; i < aligns.length; i++){
            if(aligns[i].getAttribute('data-align') == align) {
                domUtils.addClass(aligns[i], 'focus');
                $G("align").value = aligns[i].getAttribute('data-align');
            } else {
                domUtils.removeClasses(aligns[i], 'focus');
            }
        }
    }
    /* 获取对齐方式 */
    function getAlign(){
        var align = $G("align").value || 'none';
        return align == 'none' ? '':align;
    }


    /* 在线图片 */
    function RemoteImage(target) {
        this.container = utils.isString(target) ? document.getElementById(target) : target;
        this.init();
    }
    RemoteImage.prototype = {
        init: function () {
            this.initContainer();
            this.initEvents();
        },
        initContainer: function () {
            this.dom = {
                'url': $G('preview').getAttribute('data-img'),
                'width': $G('width'),
                'height': $G('height'),
                'border': $G('border'),
                'vhSpace': $G('vhSpace'),
                'title': $G('title'),
                'align': $G('align')
            };
            var img = editor.selection.getRange().getClosedNode();
            if (img) {
                this.setImage(img);
            }
        },
        initEvents: function () {
            var _this = this;

            /* 改变url */
            domUtils.on($G("upload"), 'keyup', updatePreview);
            domUtils.on($G("border"), 'keyup', updatePreview);
            domUtils.on($G("title"), 'keyup', updatePreview);

            function updatePreview(){
                _this.setPreview();
            }
        },
        setImage: function(img){
            /* 不是正常的图片 */
            if (!img.tagName || img.tagName.toLowerCase() != 'img' && !img.getAttribute("src") || !img.src) return;

            var wordImgFlag = img.getAttribute("word_img"),
                src = wordImgFlag ? wordImgFlag.replace("&amp;", "&") : (img.getAttribute('_src') || img.getAttribute("src", 2).replace("&amp;", "&")),
                align = editor.queryCommandValue("imageFloat");

            /* 防止onchange事件循环调用 */
            if (src !== $G("upload").value) $G("upload").value = src;
            if(src) {
                /* 设置表单内容 */
                $G("width").value = img.width || '';
                $G("height").value = img.height || '';
                $G("border").value = img.getAttribute("border") || '0';
                $G("vhSpace").value = img.getAttribute("vspace") || '0';
                $G("title").value = img.title || img.alt || '';
                setAlign(align);
                this.setPreview();
            }
        },
        getData: function(){
            var data = {};
            for(var k in this.dom){
                data[k] = this.dom[k].value;
            }
            return data;
        },
        setPreview: function(url){
            var
                ow = $G('width').value || '',
                oh = $G('height').value || '',
                border = $G('border').value || 0,
                title = $G('title').value || '',
                preview = $G('preview'),
                width,
                height;

            width = ((!ow || !oh) ? preview.offsetWidth:Math.min(ow, preview.offsetWidth));
            width = width+(border*2) > preview.offsetWidth ? width:(preview.offsetWidth - (border*2));
            height = (!ow || !oh) ? '':width*oh/ow;

            if(url) {
                preview.innerHTML = '<img src="' + url + '" width="' + width + '" height="' + height + '" border="' + border + 'px solid #000" title="' + title + '" />';
            }
        },
        getInsertList: function () {
            debugger;
            var data = this.getData();
            if(data['upload']) {
                return [{
                    src: data['upload'],
                    _src: data['upload'],
                    width: data['width'] || '',
                    height: data['height'] || '',
                    border: data['border'] || '',
                    floatStyle: data['align'] || '',
                    vspace: data['vhSpace'] || '',
                    alt: data['title'] || '',
                    style: "width:" + data['width'] + "px;height:" + data['height'] + "px;"
                }];
            } else {
                return [];
            }
        }
    };



    /* 上传图片 */
    function UploadImage(target) {
        this.$wrap = target.constructor == String ? $('#' + target) : $(target);
        this.init();
    }
    UploadImage.prototype = {
        init: function () {
            // this.imageList = [];
            console.log(this.queueList);
            debugger;
            this.queueList = [];
            this.initContainer();
            this.initUploader();
            // this.initEvents();
        },
        initContainer: function () {
            this.$queue = this.$wrap.find('#preview');
            this.dom = {
                'width': $G('width'),
                'height': $G('height'),
                'border': $G('border'),
                'vhSpace': $G('vhSpace'),
                'title': $G('title'),
                'align': $G('align')
            };
            //var url = $G('preview').getAttribute('data-img');
            var img = editor.selection.getRange().getClosedNode();
            if (img) {
                this.setImage(img);
            }
            // // 点击修改时，设置图片
            // if (url) {
            //     this.setPreview(url);
            // }
        },
        /* 初始化容器 */
        initUploader: function () {
            var _this = this,
                $ = jQuery,    // just in case. Make sure it's not an other libaray.
                $wrap = _this.$wrap,
            // 图片容器
                $queue = $wrap.find('#preview'),
            // 状态栏，包括进度和控制按钮
                $statusBar = $wrap.find('.statusBar'),
            // 文件总体选择信息。
                $info = $statusBar.find('.info'),
            // 上传按钮
                $upload = $wrap.find('.uploadBtn'),
            // 上传按钮
                $filePickerBlock = $wrap.find('.filePickerBlock'),
            // 没选择文件之前的内容。
                $placeHolder = $wrap.find('.placeholder'),
            // 总体进度条
                $progress = $statusBar.find('.progress').hide(),
            // 添加的文件数量
                fileCount = 0,
            // 添加的文件总大小
                fileSize = 0,
            // 优化retina, 在retina下这个值是2
                ratio = window.devicePixelRatio || 1,
            // 缩略图大小
                thumbnailWidth = 113 * ratio,
                thumbnailHeight = 113 * ratio,
            // 可能有pedding, ready, uploading, confirm, done.
                state = '',
            // 所有文件的进度信息，key为file id
                percentages = {},
                supportTransition = (function () {
                    var s = document.createElement('p').style,
                        r = 'transition' in s ||
                            'WebkitTransition' in s ||
                            'MozTransition' in s ||
                            'msTransition' in s ||
                            'OTransition' in s;
                    s = null;
                    return r;
                })(),
            // WebUploader实例
                uploader,
                actionUrl = editor.getActionUrl(editor.getOpt('imageActionName')),
                acceptExtensions = (editor.getOpt('imageAllowFiles') || []).join('').replace(/\./g, ',').replace(/^[,]/, ''),
                imageMaxSize = editor.getOpt('imageMaxSize'),
                imageCompressBorder = editor.getOpt('imageCompressBorder');

            if (!WebUploader.Uploader.support()) {
                $('#filePickerReady').after($('<div>').html(lang.errorNotSupport)).hide();
                return;
            // } else if (!editor.getOpt('imageActionName')) {
            //     $('#filePickerReady').after($('<div>').html(lang.errorLoadConfig)).hide();
            //     return;
            }

            uploader = _this.uploader = WebUploader.create({
                pick: {
                    id: '#filePickerReady',
                    label: lang.uploadSelectFile // 点击上传图片
                },
                accept: {
                    title: 'Images',
                    extensions: acceptExtensions,
                    mimeTypes: 'image/*'
                },
                // swf: '../../third-party/webuploader/Uploader.swf',
                server: actionUrl,
                fileVal: editor.getOpt('imageFieldName'),
                duplicate: true,
                fileSingleSizeLimit: imageMaxSize,    // 默认 2 M
                compress: editor.getOpt('imageCompressEnable') ? {
                    width: imageCompressBorder,
                    height: imageCompressBorder,
                    // 图片质量，只有type为`image/jpeg`的时候才有效。
                    quality: 90,
                    // 是否允许放大，如果想要生成小图的时候不失真，此选项应该设置为false.
                    allowMagnify: false,
                    // 是否允许裁剪。
                    crop: false,
                    // 是否保留头部meta信息。
                    preserveHeaders: true
                }:false
            });

            setState('pedding');

            // 当有文件添加进来时执行，负责view的创建
            function addFile(file) {
                var $li = $('<div id="' + 'uploadImage' + '">' +
                    '</div>'),

                   $prgress = $li.find('p.progress span'),
                   $wrap = $li,
                   $info = $('<p class="error"></p>').hide().appendTo($li),

                    showError = function (code) {
                        switch (code) {
                            case 'exceed_size':
                                text = lang.errorExceedSize;
                                break;
                            case 'interrupt':
                                text = lang.errorInterrupt;
                                break;
                            case 'http':
                                text = lang.errorHttp;
                                break;
                            case 'not_allow_type':
                                text = lang.errorFileType;
                                break;
                            default:
                                text = lang.errorUploadRetry;
                                break;
                        }
                        $info.text(text).show();
                    };

                if (file.getStatus() === 'invalid') {
                    showError(file.statusText);
                } else {
                    $wrap.text(lang.uploadPreview);
                    if (browser.ie && browser.version <= 7) {
                        $wrap.text(lang.uploadNoPreview);
                    } else {
                        uploader.makeThumb(file, function (error, src) {
                            if (error || !src) {
                                $wrap.text(lang.uploadNoPreview);
                            } else {
                                 var $img = $('<img src="' + src + '">');
                                remoteImage.setPreview(src);
                                $img.on('error', function () {
                                    $wrap.text(lang.uploadNoPreview);
                                });
                            }
                        }, thumbnailWidth, thumbnailHeight);
                    }
                    percentages[ 'uploadImage' ] = [ file.size, 0 ];
                    file.rotation = 0;

                    /* 检查文件格式 */
                    if (!file.ext || acceptExtensions.indexOf(file.ext.toLowerCase()) == -1) {
                        showError('not_allow_type');
                        uploader.removeFile();
                    }
                }

                file.on('statuschange', function (cur, prev) {
                    if (prev === 'progress') {
                        $prgress.hide().width(0);
                    } else if (prev === 'queued') {
                        $li.off('mouseenter mouseleave');
                        $btns.remove();
                    }
                    // 成功
                    if (cur === 'error' || cur === 'invalid') {
                        showError(file.statusText);
                        percentages[ 'uploadImage' ][ 1 ] = 1;
                    } else if (cur === 'interrupt') {
                        showError('interrupt');
                    } else if (cur === 'queued') {
                        percentages[ 'uploadImage' ][ 1 ] = 0;
                    } else if (cur === 'progress') {
                        $info.hide();
                        $prgress.css('display', 'block');
                    } else if (cur === 'complete') {
                    }

                    $li.removeClass('state-' + prev).addClass('state-' + cur);
                });

                $li.on('mouseenter', function () {
                    // $btns.stop().animate({height: 30});
                });
                $li.on('mouseleave', function () {
                    // $btns.stop().animate({height: 0});
                });

                // $btns.on('click', 'span', function () {
                //     var index = $(this).index(),
                //         deg;

                //     switch (index) {
                //         case 0:
                //             uploader.removeFile(file);
                //             return;
                //         case 1:
                //             file.rotation += 90;
                //             break;
                //         case 2:
                //             file.rotation -= 90;
                //             break;
                //     }

                //     if (supportTransition) {
                //         deg = 'rotate(' + file.rotation + 'deg)';
                //         $wrap.css({
                //             '-webkit-transform': deg,
                //             '-mos-transform': deg,
                //             '-o-transform': deg,
                //             'transform': deg
                //         });
                //     } else {
                //         $wrap.css('filter', 'progid:DXImageTransform.Microsoft.BasicImage(rotation=' + (~~((file.rotation / 90) % 4 + 4) % 4) + ')');
                //     }

                // });

                //$li.insertBefore($filePickerBlock);
                $("#preview").append($li);
                
            }

            // 负责view的销毁
            function removeFile() {
                var $li = $('#uploadImage');
                delete percentages['uploadImage'];
                updateTotalProgress();
                $li.off().find('.file-panel').off().end().remove();
            }

            function queueFile(file) {
                if (file && file.source && file.source.source) {
                    var reader = new FileReader();
                    reader.onload = function(e){
                        _this.queueList = [];
                        const data = e.target.result;
                        const img = new Image();
                        img.onload = () => {
                          const { width, height } = img;
                          console.log(width, height);
                        };
                        img.src = data;
                        _this.queueList.push({
                            src: e.target.result,
                            name: file.name,
                            id: file.id,
                            width,
                            height,
                        });
                    };
                    reader.readAsDataURL(file.source.source);
                }
            }

            function dequeueFile() {
                _this.queueList = [];
                // for (var i = 0; i < _this.queueList.length; i += 1) {
                //     if (_this.queueList[i].id === file.id) {
                //         _this.queueList.splice(i, 1);
                //         return;
                //     }
                // }
            }

            function updateTotalProgress() {
                var loaded = 0,
                    total = 0,
                    spans = $progress.children(),
                    percent;

                $.each(percentages, function (k, v) {
                    total += v[ 0 ];
                    loaded += v[ 0 ] * v[ 1 ];
                });

                percent = total ? loaded / total : 0;

                spans.eq(0).text(Math.round(percent * 100) + '%');
                spans.eq(1).css('width', Math.round(percent * 100) + '%');
                updateStatus();
            }

            function setState(val, files) {

                if (val != state) {

                    var stats = uploader.getStats();

                    $upload.removeClass('state-' + state);
                    $upload.addClass('state-' + val);

                    switch (val) {

                        /* 未选择文件 */
                        case 'pedding':
                            // $queue.addClass('element-invisible');
                            // $statusBar.addClass('element-invisible');
                            // $placeHolder.removeClass('element-invisible');
                            $progress.hide(); $info.hide();
                            uploader.refresh();
                            break;

                        /* 可以开始上传 */
                        case 'ready':
                            // $placeHolder.addClass('element-invisible');
                            // $queue.removeClass('element-invisible');
                            // $statusBar.removeClass('element-invisible');
                            $progress.hide(); $info.show();
                            $upload.text(lang.uploadStart);
                            uploader.refresh();
                            break;

                        /* 上传中 */
                        case 'uploading':
                            $progress.show(); $info.hide();
                            $upload.text(lang.uploadPause);
                            break;

                        /* 暂停上传 */
                        case 'paused':
                            $progress.show(); $info.hide();
                            $upload.text(lang.uploadContinue);
                            break;

                        case 'confirm':
                            $progress.show(); $info.hide();
                            $upload.text(lang.uploadStart);

                            stats = uploader.getStats();
                            if (stats.successNum && !stats.uploadFailNum) {
                                setState('finish');
                                return;
                            }
                            break;

                        case 'finish':
                            $progress.hide(); $info.show();
                            if (stats.uploadFailNum) {
                                $upload.text(lang.uploadRetry);
                            } else {
                                $upload.text(lang.uploadStart);
                            }
                            break;
                    }

                    state = val;
                    updateStatus();

                }

                if (!_this.getQueueCount()) {
                    $upload.addClass('disabled')
                } else {
                    $upload.removeClass('disabled')
                }

            }

            function updateStatus() {
                var text = '', stats;

                if (state === 'ready') {
                    text = lang.updateStatusReady.replace('_', fileCount).replace('_KB', WebUploader.formatSize(fileSize));
                } else if (state === 'confirm') {
                    stats = uploader.getStats();
                    if (stats.uploadFailNum) {
                        text = lang.updateStatusConfirm.replace('_', stats.successNum).replace('_', stats.successNum);
                    }
                } else {
                    stats = uploader.getStats();
                    text = lang.updateStatusFinish.replace('_', fileCount).
                        replace('_KB', WebUploader.formatSize(fileSize)).
                        replace('_', stats.successNum);

                    if (stats.uploadFailNum) {
                        text += lang.updateStatusError.replace('_', stats.uploadFailNum);
                    }
                }

                $info.html(text);
            }

            uploader.on('fileQueued', function (file) {
                // fileCount++;
                // fileSize += file.size;

                // if (fileCount === 1) {
                //     // $placeHolder.addClass('element-invisible');
                //     $statusBar.show();
                // }
                if (_this.queueList.length > 0) {
                    removeFile();
                }
                addFile(file);
                queueFile(file);
            });

            uploader.on('fileDequeued', function (file) {
                // if (file.ext && acceptExtensions.indexOf(file.ext.toLowerCase()) != -1 && file.size <= imageMaxSize) {
                //     fileCount--;
                //     fileSize -= file.size;
                // }

                removeFile();
                dequeueFile();
                updateTotalProgress();
            });

            uploader.on('filesQueued', function (file) {
                if (!uploader.isInProgress() && (state == 'pedding' || state == 'finish' || state == 'confirm' || state == 'ready')) {
                    setState('ready');
                }
                updateTotalProgress();
            });

            uploader.on('all', function (type, files) {
                switch (type) {
                    case 'uploadFinished':
                        setState('confirm', files);
                        break;
                    case 'startUpload':
                        /* 添加额外的GET参数 */
                        var params = utils.serializeParam(editor.queryCommandValue('serverparam')) || '',
                            url = utils.formatUrl(actionUrl + (actionUrl.indexOf('?') == -1 ? '?':'&') + 'encode=utf-8&' + params);
                        uploader.option('server', url);
                        setState('uploading', files);
                        break;
                    case 'stopUpload':
                        setState('paused', files);
                        break;
                }
            });

            uploader.on('uploadBeforeSend', function (file, data, header) {
                //这里可以通过data对象添加POST参数
                if (actionUrl.toLowerCase().indexOf('jsp') != -1) {
                    header['X-Requested-With'] = 'XMLHttpRequest';
                }
            });

            uploader.on('uploadProgress', function (file, percentage) {
                var $li = $('#uploadImage'),
                    $percent = $li.find('.progress span');

                $percent.css('width', percentage * 100 + '%');
                percentages[ 'uploadImage' ][ 1 ] = percentage;
                updateTotalProgress();
            });

            uploader.on('uploadSuccess', function (file, ret) {
                var $file = $('#' + 'uploadImage');
                try {
                    var responseText = (ret._raw || ret),
                        json = utils.str2json(responseText);
                    if (json.state == 'SUCCESS') {
                        _this.imageList.push(json);
                        $file.append('<span class="success"></span>');
                    } else {
                        $file.find('.error').text(json.state).show();
                    }
                } catch (e) {
                    $file.find('.error').text(lang.errorServerUpload).show();
                }
            });

            uploader.on('uploadError', function (file, code) {
            });
            uploader.on('error', function (code, file) {
                if (code == 'Q_TYPE_DENIED' || code == 'F_EXCEED_SIZE') {
                    addFile(file);
                    queueFile(file);
                }
            });
            uploader.on('uploadComplete', function (file, ret) {
            });

            $upload.on('click', function () {
                if ($(this).hasClass('disabled')) {
                    return false;
                }

                if (state === 'ready') {
                    uploader.upload();
                } else if (state === 'paused') {
                    uploader.upload();
                } else if (state === 'uploading') {
                    uploader.stop();
                }
            });

            $upload.addClass('state-' + state);
            updateTotalProgress();
        },
        setPreview: function(url){
            var
                ow = $G('width').value || '',
                oh = $G('height').value || '',
                border = $G('border').value || 0,
                title = $G('title').value || '',
                preview = $G('preview'),
                width,
                height;

            width = ((!ow || !oh) ? preview.offsetWidth:Math.min(ow, preview.offsetWidth));
            width = width+(border*2) > preview.offsetWidth ? width:(preview.offsetWidth - (border*2));
            height = (!ow || !oh) ? '':width*oh/ow;
            if(url) {
                 preview.innerHTML = '<img src="' + url + '" width="' + width + '" height="' + height + '" border="' + border + 'px solid #000" title="' + title + '" />';
              //  var $img = $('<img src="' + url + '" width="' + width + '" height="' + height + '" border="' + border + 'px solid #000" title="' + title + '" />');
               // debugger;
               // preview.empty().append($img);
            }
        },

        setImage: function(img){
            /* 不是正常的图片 */
            // if (!img.tagName || img.tagName.toLowerCase() != 'img' && !img.getAttribute("src") || !img.src) return;

            var wordImgFlag = img.getAttribute("word_img"),
                src = wordImgFlag ? wordImgFlag.replace("&amp;", "&") : (img.getAttribute('_src') || img.getAttribute("src", 2).replace("&amp;", "&")),
                align = editor.queryCommandValue("imageFloat");

            /* 防止onchange事件循环调用 */
            if (src !== $G("upload").value) $G("upload").value = src;
            if(src) {
                /* 设置表单内容 */
                $G("width").value = img.width || '';
                $G("height").value = img.height || '';
                $G("border").value = img.getAttribute("border") || '0';
                $G("vhSpace").value = img.getAttribute("vspace") || '0';
                $G("title").value = img.title || img.alt || '';
                setAlign(align);
                this.setPreview(src);
            }
        },

        getQueueCount: function () {
            var file, i, status, readyFile = 0, files = this.uploader.getFiles();
            for (i = 0; file = files[i++]; ) {
                status = file.getStatus();
                if (status == 'queued' || status == 'uploading' || status == 'progress') readyFile++;
            }
            return readyFile;
        },
        destroy: function () {
            this.$wrap.remove();
        },
        getData: function(){
            var data = {};
            debugger;
            for(var k in this.dom){
                data[k] = this.dom[k].value;
            }
            return data;
        },
        getInsertList: function () {
            var i, data, list = [],
                align = getAlign(),
                prefix = editor.getOpt('imageUrlPrefix');
            for (i = 0; i < this.imageList.length; i++) {
                data = this.imageList[i];
                list.push({
                    src: prefix + data.url,
                    _src: prefix + data.url,
                    alt: data.original,
                    floatStyle: align
                });
            }
            return list;
        },
        getQueueList: function () {
            var styleData = this.getData();
            debugger;
            var data,
                align = getAlign();
                data = this.queueList[0];
            return [{
                src: data.src,
                title: data.name,
                alt: data.name,
                floatStyle: align,
                width: styleData['width'] || '',
                height: styleData['height'] || '',
                border: styleData['border'] || '',
                vspace: styleData['vhSpace'] || '',
                style: "width:" + styleData['width'] + "px;height:" + styleData['height'] + "px;"
            }];
        }
    };
})();
