// create a box-shadow around an svg with the color based on the svg's color
window.addEventListener("DOMContentLoaded", (event) => {
    setTimeout(function(){
    const el = document.getElementsByClassName('linkicon'); // el = element

    for (let i = 0; i < el.length; i++) {
        el[i].addEventListener("mouseover", function(event) {
            colored(event);
        });
    }
    for (let i = 0; i < el.length; i++) {
        el[i].addEventListener("mouseout", function(event) {
            uncolored(event);
        });
    }

    function colored(event) {
        const qlElem = event.currentTarget; // get the quicklink element
        const qlChild = qlElem.querySelector(':first-child'); // get its child
        // in case it has an img and not an svg
        if (qlChild.tagName.includes("IMG")) { // ch = child
            const qlComp = window.getComputedStyle(qlElem);
            const chColor = qlComp.getPropertyValue('lighting-color'); // use its lighting-color set manually
            qlChild.style.boxShadow = `0px 0px 20px 1px ${chColor}, inset 0px 0px 10px 0px ${chColor}`;
            return;
        }
        const path = qlChild.querySelector('path')
        const pathFill = window.getComputedStyle(path);
        const chFill = pathFill.getPropertyValue('fill'); // get the color of the svg
        qlChild.style.boxShadow = `0px 0px 20px 1px ${chFill}, inset 0px 0px 10px 0px ${chFill}`;
        // in case the svg doesn't have an rgb value
        if (!chFill.includes("rgb")) {
            const qlComp = window.getComputedStyle(qlEl);
            const chColor = qlComp.getPropertyValue('lighting-color'); // use .linkicon's lighting-color set manually
            qlChild.style.boxShadow = `0px 0px 20px 1px ${chColor}, inset 0px 0px 10px 0px ${chColor}`;
        } else if (chFill.includes("none")) {
            const chColor = pathFill.getPropertyValue('stroke-color');
            qlChild.style.boxShadow = `0px 0px 20px 1px ${chColor}, inset 0px 0px 10px 0px ${chColor}`;
        } 
    }
    
    function uncolored(event) {
        const el = event.currentTarget;
        const ch = el.querySelector(':first-child');
        ch.style.boxShadow = `none`;
    }
    
}, 1000);

// ----- end -----
});