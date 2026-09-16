import { Foo } from "./foo_a.js"

export class ViaJs {
    make(): Foo {
        return new Foo()
    }
}
