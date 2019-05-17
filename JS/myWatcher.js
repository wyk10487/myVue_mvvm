function Watcher(vm, expOrFn, cb){
    this.vm = vm
    this.cb = cb
    this.expOrFn = expOrFn
    this.depIds = {}
    
    typeof expOrFn === 'function' 
                    ? this.getter = expOrFn
                    : this.getter = this.parseGetter(expOrFn.trim())

    this.value = this.get()  //这一步是把new的新Watcher添加到Dep中，告诉Dep这里有一个新的观察者
}

Watcher.prototype = {
    update(){
        this.run()
    },
    run(){
        let value = this.get()
        let oldVal = this.value
        if(value !== oldVal){
            this.value = value
            this.cb.call(this.vm, value, oldVal)
        }
    },
    addDep(dep){
        if(!this.depIds.hasOwnProperty(dep.id)){
            dep.addSub(this)
            this.depIds[dep.id] = dep
        }
    },
    get(){
        Dep.target = this
        let value = this.getter.call(this.vm, this.vm)
        Dep.target = null
        return value
    },
    parseGetter(exp){
        if(/[^\w.$]/.test(exp)) return;
        let exps = exp.split('.')
        return function(obj){
            for(let i = 0, len = exps.length; i < len; i++){
                if(!obj) return;
                obj = obj[exps[i]]
            }
            return obj
        }
    }
}