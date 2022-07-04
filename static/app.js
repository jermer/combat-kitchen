
class MonsterTable {

    constructor() {
        this.page = 1;
        this.resultsPerPage = 5;

        this.minCR = 0;
        this.maxCR = 30;
        this.type = "";

        this.HTMLtable = $('#monster-table-body');

        this.monsters = [];
    }

    /*
     *   Query the API based on the current settings
     */
    async queryMonsters() {
        const params = {
            min_cr: this.minCR,
            max_cr: this.maxCR
        }

        // get updated monster list from the api
        const resp = await axios.get(`http://localhost:5000/api/monsters`, { params: params });

        this.monsters = JSON.parse(JSON.stringify(resp.data.monsters));

        console.log(resp.data.monsters[0]);
        console.log(this.monsters[0]);

    }

    /*
     *  Update the UI
     */
    updateView() {
        // render the new table
        this.renderMonsterTable(this.monsters)
    }

    /* 
     *  Update the monster table
     */
    renderMonsterTable(monsters) {
        // empty the table
        this.HTMLtable.empty();

        // print a helpful message if no monsters
        if (monsters.length === 0) {
            this.HTMLtable.append(`<tr scope="row"><td colspan="4">No monsters match match filter parameters.</td></tr>`);
            return;
        }

        // determine starting monster based on pagination
        const start = (this.page - 1) * (this.resultsPerPage);

        for (let i = 0; i < this.resultsPerPage; i++) {
            let m = monsters[start + i];
            console.log(m.name);
            this.HTMLtable.append(this.renderMonsterTableRow(m));
        }
    }

    /*
     *  Render HTML for a table row
     */
    renderMonsterTableRow(monster) {
        return (`<tr scope="row" data-mid="${monster.id}">
            <td><i class="fa-solid fa-eye monster-detail" ></i></td>
            <td>${monster.name}</td>
            <td>${monster.size}</td>
            <td>${monster.cr}</td>
            <td>${monster.type}</td>
        </tr>`)
    }

    /* 
     *  Logic for pagination
     */
    showNextPage() {
        this.page++;
        this.updateView()
    }

    showPrevPage() {
        this.page = this.page > 1 ? this.page - 1 : 1
        this.updateView()
    }
}


/*
 *  On page load, instantiate a new MonsterTable and populate monster list
 */
var MONSTER_TABLE;

$(document).ready(async function () {
    MONSTER_TABLE = new MonsterTable();
    // debugger;
    await MONSTER_TABLE.queryMonsters();
    // debugger;
    MONSTER_TABLE.updateView();
});


/*
 *  PAGINATION BUTTONS
 */
$('#table-prev-btn').on("click", function (e) {
    MONSTER_TABLE.showPrevPage(e)
});

$('#table-next-btn').on("click", function (e) {
    MONSTER_TABLE.showNextPage(e)
});


/*
 *  SEARCH FORM
 */
$('#monster-filter-form').submit(handleFormSubmit)

async function handleFormSubmit(evt) {
    evt.preventDefault();
    $('#monster-table-body').empty()

    // const cr = $('#cr-input').val();

    const minCR = translateSliderRange($("#slider-range").slider("values", 0))[0];
    const maxCR = translateSliderRange($("#slider-range").slider("values", 1))[0];

    const type = $("#type-input").val();

    // const resultsPerPage = $("#results-per-page-input").val();

    // console.log(`Form submitted with CR = ${cr}`);
    console.log(`Form submitted with CR range = ${minCR} - ${maxCR} and type = ${type}`);

    const params = {
        min_cr: minCR,
        max_cr: maxCR,
        type: type
        // results_per_page: resultsPerPage
    }

    const resp = await axios.get(`http://localhost:5000/api/monsters`, { params: params });

    renderMonsterTable(resp.data.monsters)
}


/*

function detail(evt) {
    // var test = $(this).closest('tr').attr('data-mid');
    var test = $(this).closest('tr').data('mid');
    console.log(test);

    //debugger

    var myOffcanvas = document.getElementById(`offcanvasMonster${test}`);
    var bsOffcanvas = new bootstrap.Offcanvas(myOffcanvas)
    bsOffcanvas.show();
}

$("#monster-table tbody").on("click", "i", detail)

*/


/*
 *  CHALLENGE RATING DOUBLE-ENDED SLIDER
 */
const FRACTION_CRS = [
    [0.5, "1/2"],
    [0.25, "1/4"],
    [0.125, "1/8"],
    [0, "0"]
]

$("#slider-range").slider({
    range: true,
    min: -3,
    max: 30,
    step: 1,
    values: [-3, 30],
    slide: function (event, ui) {
        // $("#amount").val(ui.values[0] + " - " + ui.values[1]);
        $("#amount").val(translateSliderRange(ui.values[0])[1] + " - " + translateSliderRange(ui.values[1])[1]);
    }
});
// $("#amount").val($("#slider-range").slider("values", 0) +
// " - " + $("#slider-range").slider("values", 1));
$("#amount").val("0 - 30");


function translateSliderRange(val) {
    if (val >= 1) {
        return [val, val.toString()];
    }
    else {
        return FRACTION_CRS[-val];
    }
}
