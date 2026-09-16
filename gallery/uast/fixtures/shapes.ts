export interface Named {
    label: string
    size(): number
}

class Base {
    ping(): void {}
}

export class Child extends Base {
    label: string
    size(): number {
        this.ping()
        return 1
    }
}

export function makeChild(): Child {
    return new Child()
}

export default class DefaultBox {
    wrap(): Child {
        return makeChild()
    }
}
