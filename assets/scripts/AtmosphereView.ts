import Component from "../../src/component/Component.ts";
import Camera from "../../src/component/Camera.ts";
import { is } from "../../lib/jsml/jsml.ts";
import Keyboard from "../../src/input/Keyboard.ts";
import SkyRenderer from "../../src/component/renderer/SkyRenderer.ts";



export default class AtmosphereView extends Component {
    public awake(): void {
        Keyboard.register({
            key: "m",
            onPress: () => this.focus()
        });
    }



    public focus(): void {
        const cam = this.gameObject.getComponent(Camera);
        if (!is(cam)) {
            return;
        }

        const sky = this.gameObject.getComponent(SkyRenderer);
        if (!is(sky)) {
            return;
        }

        sky.atmosphereHeight = 20;
        this.scene.setActiveCamera(cam);

        this.transform
            .setPosition3(0, 22, 0);

        const time = this.scene.getTime();
        time.dayDuration = 15;
    }
}