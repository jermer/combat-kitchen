

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

    async updateSettings(minCR, maxCR, type, resultsPerPage) {
        this.minCR = minCR;
        this.maxCR = maxCR;
        this.type = type;

        this.page = 1;
        this.resultsPerPage = resultsPerPage;

        await this.queryMonsters();
        this.updateView();
    }

    /*
     *   Query the API based on the current settings
     */
    async queryMonsters() {
        const params = {
            min_cr: this.minCR,
            max_cr: this.maxCR,
            type: this.type
        }

        // get updated monster list from the api
        const resp = await axios.get(`http://localhost:5000/api/monsters`, { params: params });

        // this.monsters = JSON.parse(JSON.stringify(resp.data.monsters));
        this.monsters = resp.data.monsters;
    }

    /*
     *  Update the UI
     */
    updateView() {
        // render the new table
        this.renderMonsterTable(this.monsters)

        console.debug(`page = ${this.page}`)

        // update pagination buttons
        if (this.page === 1) {
            $('#table-prev-btn').parent().addClass('disabled');
        }
        else {
            $('#table-prev-btn').parent().removeClass('disabled');
        }

        const maxPages = Math.ceil(this.monsters.length / this.resultsPerPage);
        if (this.page === maxPages) {
            $('#table-next-btn').parent().addClass('disabled');
        }
        else {
            $('#table-next-btn').parent().removeClass('disabled');
        }
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

        for (let i = 0; i < this.resultsPerPage && start + i < monsters.length; i++) {
            let m = monsters[start + i];
            this.HTMLtable.append(this.renderMonsterTableRow(m));
        }
    }

    /*
     *  Render HTML for a table row
     */
    renderMonsterTableRow(monster) {
        return (`<tr scope="row" data-mid="${monster.id}">
            <td>
                <a href="#"><i class="fa-solid fa-circle-arrow-left add-to-encounter" title="add to encounter"></i></a>

               <a href="#" class="monster-detail"><i class="fa-solid fa-eye" title="view stat block"></i></a>

                <a href="#"><i class="fa-solid fa-pen-nib edit-monster" title="edit monster"></i></a>
            </td>
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
        this.updateView();
    }

    showPrevPage() {
        this.page--;
        this.updateView();
    }
}


/*
 *  On page load, instantiate a new MonsterTable and populate monster list
 */
var MONSTER_TABLE;

$(document).ready(async function () {
    $('.toast').toast('show');

    MONSTER_TABLE = new MonsterTable();
    await MONSTER_TABLE.queryMonsters();
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

$("#results-per-page-input").on("change", handleFormSubmit)
$("#type-input").on("change", handleFormSubmit)
$("#amount").on("change", handleFormSubmit)

$("#text-search-input").on("keyup", filterList)

function filterList(evt) {
    evt.preventDefault();

    $filterText = $("#text-search-input").val().toLowerCase()

    console.log(`Searching with text ${$filterText}...`)

    for ( m of MONSTER_TABLE.monsters ) {
        if (m.name.toLowerCase().indexOf($filterText) >=0)
            console.log(m.name)
    }
}


async function handleFormSubmit(evt) {
    evt.preventDefault();

    const minCR = translateSliderRange($("#slider-range").slider("values", 0))[0];
    const maxCR = translateSliderRange($("#slider-range").slider("values", 1))[0];

    const type = $("#type-input").val();

    const resultsPerPage = $("#results-per-page-input").val();

    console.debug(`Form submitted with:
        \n-- CR range = ${minCR} - ${maxCR}
        \n-- type = ${type}
        \n-- results per page = ${resultsPerPage}
        `);

    MONSTER_TABLE.updateSettings(
        minCR,
        maxCR,
        type,
        resultsPerPage
    );

    // const params = {
    //     min_cr: minCR,
    //     max_cr: maxCR,
    //     type: type
    //     // results_per_page: resultsPerPage
    // }

    // const resp = await axios.get(`http://localhost:5000/api/monsters`, { params: params });

    // renderMonsterTable(resp.data.monsters)
}


$("#monster-table tbody").on("click", ".add-to-encounter", addToEncounter)
$("#monster-table tbody").on("click", ".monster-detail", showMonsterStats)
$("#monster-table tbody").on("click", ".edit-monster", editMonster)

function addToEncounter(evt) {
    var monster_id = $(this).closest('tr').data('mid');

    alert(`Click to ADD monster with id = ${monster_id}`)

}


async function showMonsterStats(evt) {

    var monster_id = $(this).closest('tr').data('mid');

    //alert(`Click on monster with id = ${monster_id}`)

    const monsterModal = document.getElementById(`monsterModal`);

    const resp = await axios.get(`http://localhost:5000/api/monsters/${monster_id}`)

    //debugger
    // $mbody = $('#monsterModal .modal-body')
    // $mbody.empty()
    // $mbody.html(resp.data)

    $('#monsterModal .modal-body')
        .empty()
        .html(resp.data)

    const bsModal = new bootstrap.Modal(monsterModal)
    bsModal.show();
}

function editMonster(evt) {
    var monster_id = $(this).closest('tr').data('mid');

    alert(`Click to EDIT monster with id = ${monster_id}`)

}


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
        $("#amount").change();
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
