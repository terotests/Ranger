import { Foo } from "./foo_a"
import { Z } from "./nope"

export class Uses {
    make(): Foo {
        return new Foo()
    }
}
