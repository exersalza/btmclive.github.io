import Component from "../../src/component/Component";
import GameObject from "../../src/object/GameObject";
import { Opt } from "../../lib/types";
import { is } from "../../lib/jsml/jsml";



export default class LookAt extends Component {
    private target: Opt<GameObject>;

    public update() {
        if (is(this.target)) {
            this.transform.lookAtTransform(this.target.transform);
        }
    }

    public setTarget(target: Opt<GameObject>): void {
        this.target = target;
    }
}