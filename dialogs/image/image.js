/**
 * User: Jinqn
 * Date: 14-04-08
 * Time: 下午16:34
 * 上传图片对话框逻辑代码,包括tab: 远程图片/上传图片/在线图片/搜索图片
 */

(function () {

    var uploadImage;
    var uploadFunc;

    window.onload = function () {
        initUpload();
        initAlign();
        initButtons();
    };

    // 初始化
    function initUpload() {
        setAlign(editor.getOpt('imageInsertAlign'));
        setUploadFunc(editor.getOpt('imageUploadFunc'));
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
    function initAlign() {
        /* 点击align图标 */
        domUtils.on($G("alignIcon"), 'click', function(e){
            var target = e.target || e.srcElement;
            if(target.className && target.className.indexOf('-align') != -1) {
                setAlign(target.getAttribute('data-align'));
            }
        });
    }

    /* 设置对齐方式 */
    function setAlign(align) {
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
    function getAlign() {
        var align = $G("align").value || 'none';
        return align == 'none' ? '':align;
    }
    /* 设置对齐方式 */
    function setUploadFunc(func) {
        uploadFunc = func;
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
                var fileid = img.getAttribute('fileidstart');
                if (fileid) {
                    img.fileid = fileid;
                }
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
            // 所有文件的进度信息，key为file id
                percentages = {},
            // WebUploader实例
                uploader,
                actionUrl = editor.getActionUrl(editor.getOpt('imageActionName')),
                acceptExtensions = (editor.getOpt('imageAllowFiles') || []).join('').replace(/\./g, ',').replace(/^[,]/, ''),
                imageMaxSize = editor.getOpt('imageMaxSize'),
                imageCompressBorder = editor.getOpt('imageCompressBorder');

            if (!WebUploader.Uploader.support()) {
                $('#filePickerReady').after($('<div>').html(lang.errorNotSupport)).hide();
                return;
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
                        // 调用用户配置的上传方法处理
                        if (uploadFunc) {
                            uploadFunc(file.source.source, function(fileVal) {
                                var img = {
                                    src: fileVal.url,
                                    fileid: fileVal.fileId,
                                    name: file.name,
                                    id: file.id,
                                }
                                _this.queueList = [img];
                                var $img = $('<img src="' + fileVal.url + '">');
                                _this.setPreview(fileVal.url);
                                $img.on('error', function () {
                                    $wrap.text(lang.uploadNoPreview);
                                });
                            }, function() {
                                removeFile()
                            });
                            return;
                        }
                        // 转换Base64方式处理
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
                                var $img = $('<img src="' + data + '">');
                                _this.setPreview(data);
                                $img.on('error', function () {
                                    $wrap.text(lang.uploadNoPreview);
                                });
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
                $("#preview").append($li);
            }

            // 负责view的销毁
            function removeFile() {
                var $li = $('#uploadImage');
                delete percentages['uploadImage'];
                $li.off().find('.file-panel').off().end().remove();
            }

            uploader.on('fileQueued', function (file) {
                if (_this.queueList.length > 0) {
                    removeFile();
                }
                addFile(file);
                return false;
            });
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

            imgUrl = url ? url : this.queueList[0].src;
            preview.innerHTML = '<img ' +
                'src="' + imgUrl + '" ' +
                (width ? 'width="' + width + '" ' : '') +
                (height ? 'height="' + height + '" ' : '') +
                (border ? 'border="' + border + 'px solid #000" ' : '') +
                (title ? 'title="' + title + '" ' : '') +
                (vspace ? 'vspace="' + vspace + '" ' : '') +
                '/>';
        },

        setImage: function(img){
            var wordImgFlag = img.getAttribute("word_img"),
                src = wordImgFlag ? wordImgFlag.replace("&amp;", "&") : (img.getAttribute("src", 2).replace("&amp;", "&")),
                align = editor.queryCommandValue("imageFloat");

            /* 防止onchange事件循环调用 */
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

        // 获取图片列表
        getQueueList: function () {
            var styleData = this.getData();
            var data,
                align = getAlign();
                data = this.queueList[0];
            var img = {
                src: data.src,
                floatStyle: align,
                width: styleData['width'] || '',
                height: styleData['height'] || '',
                border: styleData['border'] || '',
                vspace: styleData['vhSpace'] || '',
                title: styleData['title'] || data.name,
                alt: styleData['title'] || data.name,
                style: "width:" + styleData['width'] + "px;height:" + styleData['height'] + "px;"
            };
            if (data.fileid) {
                img.fileid = data.fileid;
            }
            return [img];
        }
    };
})();
