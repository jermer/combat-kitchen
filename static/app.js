
/**
 * CONSTANTS AND SETTINGS
 */

// Lookup table of XP tiers.
// Rows represent player level (1-20).
// Columns represent challenge level:
//      [easy, medium, hard, deadly]
const XP_TIERS = [
    [25, 50, 75, 100], // level 1
    [50, 100, 150, 200], // level 2
    [75, 150, 225, 400],
    [125, 250, 375, 500],
    [250, 500, 750, 1100],
    [300, 600, 900, 1400],
    [350, 750, 1100, 1700],
    [450, 900, 1400, 2100],
    [550, 1100, 1600, 2400],
    [600, 1200, 1900, 2800],
    [800, 1600, 2400, 3600],
    [1000, 2000, 3000, 4500],
    [1100, 2200, 3400, 5100],
    [1250, 2500, 3800, 5700],
    [1400, 2800, 4300, 6400],
    [1600, 3200, 4800, 7200],
    [2000, 3900, 5900, 8800],
    [2100, 4200, 6300, 9500],
    [2400, 4900, 7300, 10900],
    [2800, 5700, 8500, 12700] // level 20
]


/**
 * MonsterTable class
 * 
 */

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
            </td>
            <td>${monster.name}</td>
            <td>${monster.size}</td>
            <td>${monster.cr}</td>
            <td>${monster.type}</td>
        </tr>`)

        // VERSION 2.0 idea: add "edit monster" icon and functionality
        // <a href="#"><i class="fa-solid fa-pen-nib edit-monster" title="edit monster"></i></a>
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
} // end class MonsterTable


/**
 * EncounterPanel class
 * 
 */

class EncounterPanel {

    constructor() {
        this.monsters = [];
        this.pcGroups = [{ num: 4, lvl: 1 }];

        // XP goals based on PCs
        this.pcXP = [0, 0, 0, 0];

        // XP totals based on monsters
    }

    update() {
        this.updatePCModel();
        this.calculatePCXP();
        this.updatePCXPView();
    }

    updatePCModel() {
        // get values from the DOM and update the object

        this.pcGroups = [];
        const pcRows = $('.pc-table-row');

        //debugger

        for (let row of pcRows) {
            let newPCGroup = {};
            newPCGroup.num = $(row).find(".party-number-input").val();
            newPCGroup.lvl = $(row).find(".party-level-input").val();

            this.pcGroups.push(newPCGroup);
        }

        // for( let i=0; i < pcRows.length; i++) {
        //     let newPCGroup = {};
        //     newPCGroup.num = $(`#party-number-input-${i}`).val();
        //     newPCGroup.lvl = $(`#party-level-input-${i}`).val();

        //     this.pcGroups.push(newPCGroup);
        // }
    }

    calculatePCXP() {
        const xpArr = this.pcGroups.reduce(function (xpArr, nextObj) {
            console.log(nextObj);

            for (let i = 0; i < 4; i++) {
                xpArr[i] += nextObj.num * XP_TIERS[nextObj.lvl - 1][i];
            }

            return xpArr;
        }, [0, 0, 0, 0]);

        console.log(xpArr);
        this.pcXP = xpArr;

        this.updatePCXPView();
    }

    updatePCXPView() {
        $('#pc-xp-table-easy').text(this.pcXP[0]);
        $('#pc-xp-table-medium').text(this.pcXP[1]);
        $('#pc-xp-table-hard').text(this.pcXP[2]);
        $('#pc-xp-table-deadly').text(this.pcXP[3]);
    }

    calculateMonsterXP() {

    }

    renderEncounterTableRow(monster) {
        return (`
            <tr>
                <td class="col">
                    <b>${monster.name}</b>
                    <p><small>(CR ${monster.cr}, XP ${monster.xp})</small></p>
                </td>
                <td class="col-2">
                    <input id="encounter-row-count-${monster.id}" type="number" class="form-control" min="1" value="1">
                </td>
                <td class="col-2">
                    <button class="btn btn-outline-danger encounter-row-delete-btn">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                </td>
            </tr>
        `)
    }

    addPCGRoup() {
        $('#pc-list').append(
            this.renderPCTableRow(this.pcGroups.length)
        );
    }

    renderPCTableRow(idx) {
        return (`
            <tr class="row pc-table-row">
                <td class="col">
                    <input id="party-number-input-${idx}" type="number" min="1" value="4" class="form-control pc-list-control party-number-input">
                </td>
                <!-- <td class="col">X</td> -->
                <td class="col">
                    <input id="party-level-input-${idx}" type="number" min="1" max="20" value="1" class="form-control pc-list-control party-level-input">
                </td>
                <td class="col">
                    <button class="btn btn-outline-danger pc-row-delete-btn">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                </td>
            </tr>
        `)
    }
} // end class EncounterPanel



/*
 *  PAGINATION BUTTONS
 */
$('#table-prev-btn').on("click", function (e) {
    MONSTER_TABLE.showPrevPage(e)
});

$('#table-next-btn').on("click", function (e) {
    MONSTER_TABLE.showNextPage(e)
});


/**
 *  SEARCH FORM
 * 
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

    for (m of MONSTER_TABLE.monsters) {
        if (m.name.toLowerCase().indexOf($filterText) >= 0)
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

    console.debug(`Click to ADD monster with id = ${monster_id}`)

    // debugger;

    if (ENCOUNTER_PANEL.monsters.indexOf(monster_id) >= 0) {
        console.debug("Already in the encounter...");

        const $inpt = $(`#encounter-row-count-${monster_id}`)

        $inpt.val(+$inpt.val() + 1)

    } else {
        ENCOUNTER_PANEL.monsters.push(monster_id)

        m = MONSTER_TABLE.monsters.find(elt => elt.id === monster_id)

        console.debug(`FOUND ${m.name}`)

        $('#encounter-monster-list').append(
            ENCOUNTER_PANEL.renderEncounterTableRow(m)
        )
    }

    // recalculate
}


$("#encounter-monster-list").on("click", ".encounter-row-delete-btn", function (evt) {
    console.log('ENC ROW DEL');
    $(this).closest('tr').remove();

    // recalculate
});

$("#pc-list").on("change", ".pc-list-control", function (evt) {
    ENCOUNTER_PANEL.update();
});

$("#add-pc-group-btn").on("click", function (evt) {
    ENCOUNTER_PANEL.addPCGRoup();
    ENCOUNTER_PANEL.update();
});

$("#pc-list").on("click", ".pc-row-delete-btn", function (evt) {
    console.log('PC ROW DEL');
    $(this).closest('tr').remove();
    ENCOUNTER_PANEL.update();
});


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





/** 
 * INITIALIZATION
 * 
 */

// On page load, instantiate a new MonsterTable and populate monster list

var MONSTER_TABLE;
var ENCOUNTER_PANEL;

$(document).ready(async function () {
    $('.toast').toast('show');

    ENCOUNTER_PANEL = new EncounterPanel();
    ENCOUNTER_PANEL.calculatePCXP();

    MONSTER_TABLE = new MonsterTable();
    await MONSTER_TABLE.queryMonsters();
    MONSTER_TABLE.updateView();
});