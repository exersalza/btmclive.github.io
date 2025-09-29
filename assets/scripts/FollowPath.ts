import Component from "../../src/component/Component";
import Spline from "../../src/component/Spline";
import { Opt } from "../../lib/types";
import { editor } from "../../src/editor/Editor";
import NumberEditor from "../../src/editor/NumberEditor";
import { is } from "../../lib/jsml/jsml";
import BooleanEditor from "../../src/editor/BooleanEditor.ts";



export default class FollowPath extends Component {
    @editor(BooleanEditor)
    public log: boolean = false;

    @editor(NumberEditor)
    public duration: number = 5;

    private _path: Opt<Spline>;
    private _t: number = 0;



    public update(): void {
        this._t += this.scene.getTime().getDeltaTime() / 5;
        this._t -= Math.floor(this._t);

        if (!is(this._path)) {
            return;
        }

        this.transform.setPosition(
            this._path.getPoint(this._t)
        );

        const section = 1 / this._path.segments.length;
        const index = Math.floor(this._t / section);
        const t0 = this._t % section;

        if (this.log) {
            console.log(index, t0);
        }
    }



    public setPath(path: Spline): void {
        this._path = path;
    }
}