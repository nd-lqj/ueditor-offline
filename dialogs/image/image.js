/**
 * User: Jinqn
 * Date: 14-04-08
 * Time: 下午16:34
 * 上传图片对话框逻辑代码,包括tab: 远程图片/上传图片/在线图片/搜索图片
 */

(function () {

    var uploadImage;

    window.onload = function () {
        initUpload();
        initAlign();
        initButtons();
    };

    // 初始化
    function initUpload() {
        setAlign(editor.getOpt('imageInsertAlign'));
        uploadImage = uploadImage || new UploadImage('queueList');
    }

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

    /* 上传图片 */
    function UploadImage(target) {
        this.$wrap = target.constructor == String ? $('#' + target) : $(target);
        this.init();
    }
    UploadImage.prototype = {
        init: function () {
            this.queueList = [];
            this.initContainer();
            this.initUploader();
            this.initEvents();
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
            var img = editor.selection.getRange().getClosedNode();
            if (img) {
                this.queueList.push(img);
                this.setImage(img);
            }
        },
        
        initEvents: function () {
            var _this = this;
            // 改变width/height/border/title/vspace
            domUtils.on($G("width"), 'keyup', updatePreview);
            domUtils.on($G("height"), 'keyup', updatePreview);
            domUtils.on($G("border"), 'keyup', updatePreview);
            domUtils.on($G("vhSpace"), 'keyup', updatePreview);
            domUtils.on($G("title"), 'keyup', updatePreview);

            function updatePreview() {
                _this.setPreview();
            }
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
                        console.log(file);
                        var reader = new FileReader();
                        reader.onload = function(e){
                            _this.queueList = [];
                            var width, height;
                            const data = e.target.result;
                            const img = new Image();
                            img.onload = () => {
                                width = img.width;
                                height = img.height;
                                _this.queueList.push({
                                    src: e.target.result,
                                    name: file.name,
                                    id: file.id,
                                    width,
                                    height,
                                });
                                uploader.makeThumb(file, function (error, src) {
                                    if (error || !src) {
                                        $wrap.text(lang.uploadNoPreview);
                                    } else {
                                        var $img = $('<img src="' + src + '">');
                                        _this.setPreview(src);
                                        $img.on('error', function () {
                                            $wrap.text(lang.uploadNoPreview);
                                        });
                                    }
                                }, width,height);
                            };
                            img.src = data;
                        }
                        reader.readAsDataURL(file.source.source);
                    };
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
                $("#preview").append($li);
                
            }

            // 负责view的销毁
            function removeFile() {
                debugger;
                var $li = $('#uploadImage');
                delete percentages['uploadImage'];
                updateTotalProgress();
                $li.off().find('.file-panel').off().end().remove();
            }
            
            function dequeueFile() {
                _this.queueList = [];
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
                if (_this.queueList.length > 0) {
                    removeFile();
                }
                addFile(file);
            });

            uploader.on('fileDequeued', function (file) {

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
                    // queueFile(file);
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
                vspace = $G('vhSpace').value || 0,
                title = $G('title').value || '',
                preview = $G('preview'),
                width,
                height,
                imgUrl;
            if (this.queueList && this.queueList.length > 0) {
                width = ow || this.queueList[0].width;
                height = oh || this.queueList[0].height;
            }

            // 待处理
            // width = ((!ow || !oh) ? preview.offsetWidth:Math.min(ow, preview.offsetWidth));
            // width = width+(border*2) > preview.offsetWidth ? width:(preview.offsetWidth - (border*2));
            // height = (!ow || !oh) ? '':width*oh/ow;
            
            imgUrl = url ? url : this.queueList[0].src;

             preview.innerHTML = '<img src="' + imgUrl + '" width="' + width + '" height="' + height + '" border="' + border + 'px solid #000" title="' + title + '" vspace="' + vspace + '"  />';
            // var $img = $('<img src="' + imgUrl + '" width="' + width + '" height="' + height + '" border="' + border + 'px solid #000" title="' + title + '" vspace="' + vspace + '" />');
            // preview.empty().append($img);
            // uploader.removeFile();
            // preview.innerHTML = $img;
        },

        setImage: function(img){
            var wordImgFlag = img.getAttribute("word_img"),
                src = wordImgFlag ? wordImgFlag.replace("&amp;", "&") : (img.getAttribute('_src') || img.getAttribute("src", 2).replace("&amp;", "&")),
                align = editor.queryCommandValue("imageFloat");

            /* 防止onchange事件循环调用 */
            console.log($G('preview'));
            if (src !== $G("preview").value) $G("preview").value = src;
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
    
        // 获取用户输入信息
        getData: function(){
            var data = {};
            for(var k in this.dom){
                data[k] = this.dom[k].value;
            }
            return data;
        },

        getQueueList: function () {
            var styleData = this.getData();
            var data,
                align = getAlign();
                data = this.queueList[0];
            return [{
                src: data.src,
                floatStyle: align,
                width: styleData['width'] || '',
                height: styleData['height'] || '',
                border: styleData['border'] || '',
                vspace: styleData['vhSpace'] || '',
                title: styleData['title'] || data.name,
                alt: styleData['title'] || data.name,
                style: "width:" + styleData['width'] + "px;height:" + styleData['height'] + "px;"
            }];
        }
    };
})();
