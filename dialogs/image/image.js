/**
 * User: liuqiju
 * Date: 03-04-19
 * Time: 下午15:43
 * 选择图片对话框逻辑代码
 */

(function () {

    var selectImage;

    window.onload = function () {
        setAlign(editor.getOpt('imageInsertAlign'));
        initAlign();
        initButtons();
        selectImage = selectImage || new SelectImage();
    };


    /* 初始化onok事件 */
    function initButtons() {
        dialog.onok = function () {
            var list = selectImage.getInsertList() || [];
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

    /* 选择图片 */
    function SelectImage() {
        this.init();
    }
    SelectImage.prototype = {
        init: function(){
            this.$imageSelectInput = $G('imageSelectInput');
            this.$selectedImage = $G('imageSelectShow');
            this.selectedImage = null;
            var that = this;
            $(this.$selectedImage).hide();
            /* 点击选择图片 */
            domUtils.on(this.$imageSelectInput, 'change', function(e){
                var files = event.target.files, file;        
                if (files && files.length > 0) {
                    // 获取目前上传的文件
                    file = files[0];
                    // 那么我们可以做一下诸如文件大小校验的动作
                    if(file.size > 1024 * 1024 * 2) {
                        alert('图片大小不能超过 2MB!');
                        return false;
                    }
                    var type = file.type && file.type.split('/');
                    type = type[1] || '';
                    if (!type || ['png', 'jpg', 'gif'].indexOf(type) === -1){
                        alert('图片格式不正确！');
                        return false;
                    }

                    var reader = new FileReader();
                    reader.readAsDataURL(file); //发起异步请求
                    reader.onload = function(e){
                        //读取完成后，将结果赋值给img的src
                        that.selectedImage = file;
                        that.$selectedImage.src = this.result;
                        that.selectedImage.src = this.result;
                        debugger;
                        $(that.$selectedImage).show();
                    }
                }
            });
        },
        destroy: function () {
            this.$selectedImage.hide();
            this.$imageSelectInput.value = '';
        },
        getInsertList: function () {
            var align = getAlign();
            return [{
                src: this.selectedImage.src,
                _src: this.selectedImage.src,
                title: this.selectedImage.name,
                alt: this.selectedImage.name,
                floatStyle: align
            }];
        }
    };
})();
