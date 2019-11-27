(function () {

    var onlineImage,
        backupStyle = editor.queryCommandValue('background');

    window.onload = function () {
        initTabs();
        onlineImage = new OnlineImage('imageList')
        initColorSelector();
    };

    /* 初始化tab标签 */
    function initTabs(){
        var tabs = $G('tabHeads').children;
        for (var i = 0; i < tabs.length; i++) {
            domUtils.on(tabs[i], "click", function (e) {
                var target = e.target || e.srcElement;
                for (var j = 0; j < tabs.length; j++) {
                    if(tabs[j] == target){
                        tabs[j].className = "focus";
                        var contentId = tabs[j].getAttribute('data-content-id');
                        $G(contentId).style.display = "block";
                    }else {
                        tabs[j].className = "";
                        $G(tabs[j].getAttribute('data-content-id')).style.display = "none";
                    }
                }
            });
        }
    }

    /* 初始化颜色设置 */
    function initColorSelector () {
        var obj = editor.queryCommandValue('background');
        if (obj) {
            var color = obj['background-color'],
                stretch = obj['background-size'] || 'no',
                repeat = obj['background-repeat'] || 'repeat',
                image = obj['background-image'] || '',
                position = obj['background-position'] || 'center center',
                pos = position.split(' '),
                x = parseInt(pos[0]) || 0,
                y = parseInt(pos[1]) || 0;

            if(repeat == 'no-repeat' && (x || y)) repeat = 'self';
            updateFormState('colored', color, image, stretch, repeat, x, y);
        } else {
            updateFormState();
        }

        var updateHandler = function () {
            updateFormState();
            updateBackground();
        }
        domUtils.on($G('nocolorRadio'), 'click', updateBackground);
        domUtils.on($G('coloredRadio'), 'click', updateHandler);
        domUtils.on($G('stretchType'), 'change', updateHandler);
        domUtils.on($G('repeatType'), 'change', updateHandler);
        domUtils.on($G('x'), 'keyup', updateBackground);
        domUtils.on($G('y'), 'keyup', updateBackground);

        initColorPicker();
    }

    /* 初始化颜色选择器 */
    function initColorPicker() {
        var me = editor,
            cp = $G("colorPicker");

        /* 生成颜色选择器ui对象 */
        var popup = new UE.ui.Popup({
            content: new UE.ui.ColorPicker({
                noColorText: me.getLang("clearColor"),
                editor: me,
                onpickcolor: function (t, color) {
                    updateFormState('colored', color);
                    updateBackground();
                    UE.ui.Popup.postHide();
                },
                onpicknocolor: function (t, color) {
                    updateFormState('colored', 'transparent');
                    updateBackground();
                    UE.ui.Popup.postHide();
                }
            }),
            editor: me,
            onhide: function () {
            }
        });

        /* 设置颜色选择器 */
        domUtils.on(cp, "click", function () {
            popup.showAnchor(this);
        });
        domUtils.on(document, 'mousedown', function (evt) {
            var el = evt.target || evt.srcElement;
            UE.ui.Popup.postHide(el);
        });
        domUtils.on(window, 'scroll', function () {
            UE.ui.Popup.postHide();
        });
    }

    /* 更新背景色设置面板 */
    function updateFormState (radio, color, url, stretch, align, x, y) {
        var nocolorRadio = $G('nocolorRadio'),
            coloredRadio = $G('coloredRadio');

        if(radio) {
            nocolorRadio.checked = (radio == 'colored' ? false:'checked');
            coloredRadio.checked = (radio == 'colored' ? 'checked':false);
        }
        if(color) {
            domUtils.setStyle($G("colorPicker"), "background-color", color);
        }

        if (url) {
            onlineImage.bgimgSelected = url;
        }
        if(stretch) {
            utils.each($G('stretchType').children, function(item){
                item.selected = (stretch == item.getAttribute('value') ? 'selected':false);
            });
        }
        if(align) {
            utils.each($G('repeatType').children, function(item){
                item.selected = (align == item.getAttribute('value') ? 'selected':false);
            });
        }
        if(x || y) {
            $G('x').value = parseInt(x) || 0;
            $G('y').value = parseInt(y) || 0;
        }

        $G('custom').style.display = coloredRadio.checked && $G('repeatType').value == 'self' ? '':'none';
    }

    /* 更新背景颜色 */
    function updateBackground () {
        var backgroundObj = null;
        var bgimg = onlineImage.bgimgSelected;
        var color = domUtils.getStyle($G("colorPicker"), "background-color");
        var stretch = $G("stretchType").value;
        var align = $G("repeatType").value;
        if ($G('coloredRadio').checked && color) {
            backgroundObj = {};
            backgroundObj["background-color"] = color;
        }
        if (bgimg) {
            if (!backgroundObj) {
                backgroundObj = {};
            }
            backgroundObj["background-image"] = 'url(' + bgimg + ')';
        }
        if (backgroundObj) {
            backgroundObj["background-repeat"] = "no-repeat";
            backgroundObj["background-position"] = "center center";
            if (stretch === 'horizontal') {
                backgroundObj["background-size"] = "100% auto";
            } else if (stretch === 'vertica') {
                backgroundObj["background-size"] = "auto 100%";
            }
            if (align === 'self') {
                backgroundObj["background-position"] = $G("x").value + "px " + $G("y").value + "px";
            } else if (align == 'repeat-x' || align == 'repeat-y' || align == 'repeat') {
                backgroundObj["background-repeat"] = align;
            }
        }
        editor.execCommand('background', backgroundObj);
    }


    /* 在线图片 */
    function OnlineImage(target) {
        this.container = utils.isString(target) ? document.getElementById(target) : target;
        this.filePickerBtn = document.getElementById('filePickerBtn');
        this.filePickerInput = document.getElementById('filePickerInput');
        this.init();
    }
    OnlineImage.prototype = {
        init: function () {
            this.bgimgSelected = null;
            this.reset();
            this.initEvents();
        },
        /* 初始化容器 */
        initContainer: function () {
            this.container.innerHTML = '';
            this.list = document.createElement('ul');
            this.clearFloat = document.createElement('li');

            domUtils.addClass(this.list, 'list');
            domUtils.addClass(this.clearFloat, 'clearFloat');

            this.list.id = 'imageListUl';
            this.list.appendChild(this.clearFloat);
            this.container.appendChild(this.list);
            
        },
        /* 初始化滚动事件,滚动到地步自动拉取数据 */
        initEvents: function () {
            var _this = this;
            /* 选择图片 */
            domUtils.on(this.filePickerBtn, 'click', function (e) {
                _this.filePickerInput.click();
            });
            domUtils.on(this.filePickerInput, 'change', function (e) {
                if (!_this.filePickerInput.value) return;
                var allowFiles = editor.getOpt("imageAllowFiles");
                // 判断文件格式是否错误
                var filename = _this.filePickerInput.value,
                    fileext = filename ? filename.substr(filename.lastIndexOf(".") + 1) : "";
                if (!fileext
                    || (allowFiles && allowFiles.join("").indexOf(fileext.toLowerCase()) == -1)) {
                    showErrorLoader(editor.getLang("simpleupload.exceedTypeError"));
                    return;
                }
                if (_this.filePickerInput.files.length > 0 && _this.filePickerInput.files[0]) {
                    var file = _this.filePickerInput.files[0];
                    var reader = new FileReader();
                    reader.readAsDataURL(file);
                    reader.onload = function(e){
                        // todo 添加到数组中
                        _this.pushData([{
                            url: this.result,
                        }]);
                    };
                    _this.filePickerInput.value = '';
                  }
            });
            /* 选中图片 */
            domUtils.on(this.container, 'click', function (e) {
                var target = e.target || e.srcElement,
                    li = target.parentNode,
                    nodes = $G('imageListUl').childNodes;

                if (li.tagName.toLowerCase() == 'li') {
                    var bgimg = '';
                    for (var i = 0, node; node = nodes[i++];) {
                        if (node == li && !domUtils.hasClass(node, 'selected')) {
                            domUtils.addClass(node, 'selected');
                            bgimg = li.firstChild.getAttribute("src");
                        } else {
                            domUtils.removeClasses(node, 'selected');
                        }
                    }
                    onlineImage.bgimgSelected = bgimg;
                    updateBackground();
                }
            });
        },
        /* 重置界面 */
        reset: function() {
            this.initContainer();
        },
        /* 添加图片到列表界面上 */
        pushData: function (list) {
            var i, item, img, icon, _this = this;
            for (i = 0; i < list.length; i++) {
                if(list[i] && list[i].url) {
                    item = document.createElement('li');
                    img = document.createElement('img');
                    icon = document.createElement('span');

                    domUtils.on(img, 'load', (function(image){
                        return function(){
                            _this.scale(image, image.parentNode.offsetWidth, image.parentNode.offsetHeight);
                        }
                    })(img));
                    img.width = 113;
                    img.setAttribute('src', list[i].url);
                    domUtils.addClass(icon, 'icon');

                    item.appendChild(img);
                    item.appendChild(icon);
                    this.list.insertBefore(item, this.clearFloat);
                }
            }
        },
        /* 改变图片大小 */
        scale: function (img, w, h, type) {
            var ow = img.width,
                oh = img.height;

            if (type == 'justify') {
                if (ow >= oh) {
                    img.width = w;
                    img.height = h * oh / ow;
                    img.style.marginLeft = '-' + parseInt((img.width - w) / 2) + 'px';
                } else {
                    img.width = w * ow / oh;
                    img.height = h;
                    img.style.marginTop = '-' + parseInt((img.height - h) / 2) + 'px';
                }
            } else {
                if (ow >= oh) {
                    img.width = w * ow / oh;
                    img.height = h;
                    img.style.marginLeft = '-' + parseInt((img.width - w) / 2) + 'px';
                } else {
                    img.width = w;
                    img.height = h * oh / ow;
                    img.style.marginTop = '-' + parseInt((img.height - h) / 2) + 'px';
                }
            }
        },
        getInsertList: function () {
            var i, lis = this.list.children, list = [], align = getAlign();
            for (i = 0; i < lis.length; i++) {
                if (domUtils.hasClass(lis[i], 'selected')) {
                    var img = lis[i].firstChild,
                        src = img.getAttribute('_src');
                    list.push({
                        src: src,
                        floatStyle: align
                    });
                }

            }
            return list;
        }
    };

    dialog.onok = function () {
        updateBackground();
        editor.fireEvent('saveScene');
    };
    dialog.oncancel = function () {
        editor.execCommand('background', backupStyle);
    };
})();