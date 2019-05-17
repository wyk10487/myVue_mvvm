function Observer(val) {
    this.data = val
    this.walk(val)
}

Observer.prototype = {
    walk(data) {
        let me = this
        Object.keys(data).forEach(key => me.convert(key, data[key]))
    },
    convert(key, val) {
        this.defineReactive(this.data, key, val)
    },
    defineReactive(data, key, val) {
        let dep = new Dep()
        let childObj = observe(val)

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
                childObj = observe(newVal)
                dep.notify() //通知所有的watcher
            }
        })
    }
}

function observe(val, vm) {
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