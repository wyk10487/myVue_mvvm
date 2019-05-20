function myVue(options){
    this.$options = options || {}
    let data = this._data = this.$options.data
    let me = this
    
    //使用proxy实现数据代理
    Object.keys(data).forEach(key => me._proxyData(key))
    //初始化computed属性
    this._initComputed()
    //注册新的观察者
    observe(data, me)

    this.$compile = new Compile(options.el || document.body, me)
    // console.log(document.body);
}

myVue.prototype = {
    $watch(key, cb, options) {
        new Watcher(this, key, cb);
    },
    //数据代理结果：当访问vm.xxx的时候实际上访问的是vm._data.xxx
    _proxyData(key, setter, getter) {
        let me = this
        setter = setter || 
        Object.defineProperty(me, key, {
            enumerable: true,  //可枚举
            configurable: false,  //不可修改，此后只能修改write属性为false,不可修改为true
            get() {
                return me._data[key]  //有了这一步，每当访问vm实例中data某个数据时，首先会经过这一层代理
            },
            set(newKey) {
                me._data[key] = newKey
            }
        })
    },
    //初始化vm的computed属性，使其能够正确运行
    _initComputed() {
        let me = this
        let computed = this.$options.computed
        if(typeof computed === 'object') {
            Object.keys(computed).forEach(key => {
                Object.defineProperty(me, key, {
                    get: typeof computed[key] === 'function'
                            ? computed[key]
                            : computed[key].get
                })
            })
        }
    }
}