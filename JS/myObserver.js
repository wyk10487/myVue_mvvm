function Observer(val) {
    this.data = val  //把要观察的对象的数据保存至新建实例的data中
    this.walk(val)
}

Observer.prototype = {
    walk(data) {
        let me = this
        Object.keys(data).forEach(key => me.convert(key, data[key])) //遍历被观察对象中所有的属性，使其内数据都会被劫持
    },
    convert(key, val) {
        this.defineReactive(this.data, key, val)
    },
    defineReactive(data, key, val) {
        let me = this
        let dep = new Dep()
        if(me.isObject(val)){
            observe(val)
        }

        Object.defineProperty(data, key, {
            enumerable: true,
            configurable: false,
            get(){
                if(Dep.target){ //如果有Dep.target,说明需要添加新的dep
                    dep.depend()
                }
                return val
            },
            set(newVal){
                if(newVal === val){
                    return;
                }
                val = newVal
                if(me.isObject(val)){
                    observe(val)
                }
                dep.notify() //通知所有的watcher
            }
        })
    },
    isObject(val){  //判断是否是真正的object
        return Object.prototype.toString.call(val) === "[object Object]"  
    }
}
//每当指明观察某个对象时，新建一个Observer
function observe(val) {
    if(!val || typeof val !== 'object') return;
    return new Observer(val)
}


//实现一个消息订阅器。其本质上就是一个数组，用来收集订阅者。
var uid = 0
function Dep() {
    this.id = uid++
    this.subs = []
}

Dep.prototype = {
    //增添一个订阅者
    addSub(sub){
        this.subs.push(sub)
    },
    //增添一个Dep
    depend(){
        Dep.target.addDep(this)
    },
    //移除一个订阅者
    removeSub(sub) {
        let idx = this.subs.indexOf(sub)
        if(idx > -1) {
            this.subs.splice(idx, 1)
        }
    },
    //当数据变动时会触发notify，再调用订阅者的update更新方法。
    notify(){
        this.subs.forEach(sub => sub.update())
    }
}

Dep.target = null