class DurationElement extends HTMLElement {
    constructor() {
        super();
        this.start = "";
        this.end = "";
        this.format = "";
    }

    connectedCallback() {
        this.start = new Date(this.getAttribute("start"));
        this.end = this.getAttribute("end") != "" ? new Date(this.getAttribute("end")) : new Date();
        this.format = this.getAttribute("format");
        console.log(this.start);
        console.log(this.getAttribute("end"));
        let msDuration = this.end - this.start;
        console.log(msDuration);
        let years = Math.floor(msDuration / (1000 * 60 * 60 * 24 * 365.25));
        let months = Math.floor(msDuration / (1000 * 60 * 60 * 24 * 30.25) - (12 * years));
        this.textContent = years + " years, " + months + " months";
    }
}
customElements.define('x-duration', DurationElement);