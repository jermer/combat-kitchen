"use strict"

// This is the global monster table
let MONSTER_TABLE;

$(document).ready(async function () {
    // Create and initialize a new monster table
    MONSTER_TABLE = new MonsterTable();
    await MONSTER_TABLE.initialize();

    // Enable tooltips
    const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
    const tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl));    
});


/**
 *  MonsterTable class
 */
class MonsterTable {

    constructor() {
        this.page = 1;
        this.resultsPerPage = 10;

        this.minCR = 0;
        this.maxCR = 30;
        this.type = "";
        this.size = "";
        this.status = "both";

        this.HTMLtable = $('#monster-table-body');

        this.allMonsters = [];
        this.monsters = [];
    }

    /**
     *  Initialize a new monster table
     */
    async initialize() {
        await MONSTER_TABLE.queryMonsters();
        MONSTER_TABLE.updateView();
    }

    /**
     *  Update internal filter parameters and fetch from the API
     */
    async updateSettings(minCR, maxCR, type, size, status) {
        this.minCR = minCR;
        this.maxCR = maxCR;
        this.type = type;
        this.size = size;
        this.status = status

        this.page = 1;

        await this.queryMonsters();
        this.updateView();
    }

    /**
     *  Query the API based on the current settings
     */
    async queryMonsters() {
        const params = {
            min_cr: this.minCR,
            max_cr: this.maxCR,
            type: this.type,
            size: this.size,
            status: this.status
        }

        // get updated monster list from the api
        const resp = await axios.get(`/api/monsters`, { params: params });

        // this.monsters = JSON.parse(JSON.stringify(resp.data.monsters));
        this.monsters = resp.data.monsters;
    }

    /*
     *  Update the complete table UI
     */
    updateView() {
        let monsterList = this.monsters;

        // filter based on search box input
        const filterText = $("#text-search-input").val().toLowerCase();

        if (filterText !== '') {
            monsterList = this.monsters.filter(m =>
                m.name.toLowerCase().indexOf(filterText) >= 0
            );
        }

        // render the new table
        this.renderMonsterTable(monsterList)

        // update pagination buttons
        if (this.page === 1) {
            $('#table-prev-btn').parent().addClass('disabled');
        }
        else {
            $('#table-prev-btn').parent().removeClass('disabled');
        }

        const maxPages = Math.ceil(monsterList.length / this.resultsPerPage);
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
    renderMonsterTable(monster_list) {
        // empty the table
        this.HTMLtable.empty();

        // print a helpful message if no monsters
        if (monster_list.length === 0) {
            this.HTMLtable.append(`<tr scope="row"><td colspan="4">No monsters match filter parameters.</td></tr>`);
            return;
        }

        // determine starting monster based on pagination
        const start = (this.page - 1) * (this.resultsPerPage);

        for (let i = 0; i < this.resultsPerPage && start + i < monster_list.length; i++) {
            let m = monster_list[start + i];
            this.HTMLtable.append(this.renderMonsterTableRow(m));
        }
    }

    /*
     *  Render HTML for a table row
     */
    renderMonsterTableRow(monster) {
        return (`<tr scope="row" data-mid="${monster.id}">
            <td>
                <a href="#"><i class="fa-solid fa-circle-arrow-left add-to-encounter" data-bs-toggle="tooltip" title="add to encounter"></i></a>

                <a href="#" class="monster-detail"><i class="fa-solid fa-eye" data-bs-toggle="tooltip" title="view stat block"></i></a>
            </td>
            <td>${monster.name}</td>
            <td>${monster.size}</td>
            <td data-order="${monster.challenge_rating}">${monster.cr}</td>
            <td>${monster.type}</td>
        </tr>`)

        // Version 2 feature idea: add "edit monster" icon and functionality
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


/************************************************************
 * 
 *  MONSTER TABLE UI ELEMENTS
 * 
 *  These elements handle updates to the monster list
 *  fully on the client side
 */

// Pagination buttons
$('#table-prev-btn').on("click", function (e) {
    MONSTER_TABLE.showPrevPage(e)
});

$('#table-next-btn').on("click", function (e) {
    MONSTER_TABLE.showNextPage(e)
});

// Results per page input
$("#results-per-page-input").on("change",
    function (evt) {
        MONSTER_TABLE.resultsPerPage = $(this).val();;
        MONSTER_TABLE.updateView();
    });

// Text search input
$("#text-search-input").on("keyup",
    function (evt) {
        evt.preventDefault();
        MONSTER_TABLE.updateView();
    });

////
//// Version 2 feature idea: click column headers to sort
////
// $(".column-header").on("click",
//     function (evt) {
//         console.log(`Column head clicked!`);
//     });


/************************************************************
 * 
 *  ENCOUNTER PANEL INTERACTION
 * 
 *  These elements allow monsters to be added to the 
 *  encounter panel
 */

/**
 *  Clicking the "arrow" icon in the monster table adds that
 *  monster to the current encounter.
 */
$("#monster-table tbody").on("click", ".add-to-encounter",
    function (evt) {
        var monster_id = $(this).closest('tr').data('mid');
        ENCOUNTER_PANEL.addNewMonster(monster_id);
    });

/**
*  Clicking the "eye" icon in the monster table triggers a pop-up
*  dialog containing the monster's stat block.
*/
$("#monster-table tbody").on("click", ".monster-detail",
    async function (evt) {
        var monster_id = $(this).closest('tr').data('mid');

        const resp = await axios.get(`/api/monsters/${monster_id}`)

        $('#monsterModal .modal-body')
            .empty()
            .html(resp.data)

        const monsterModal = $('#monsterModal');
        const bsModal = new bootstrap.Modal(monsterModal)
        bsModal.show();
    });


//// Version 2 feature idea: Clicking the "pen" icon int the monster
//// table allows the user to edit the monster's stat block.
// $("#monster-table tbody").on("click", ".edit-monster", editMonster)
//
// function editMonster(evt) {
//     var monster_id = $(this).closest('tr').data('mid');
//     alert(`Click to EDIT monster with id = ${monster_id}`)
// }


/************************************************************
 * 
 *  MONSTER FILTER FORM
 * 
 *  These elements handle filter options that become part of
 *  a new request to the API
 */
$("#type-input").on("change", handleFormSubmit)
$("#size-input").on("change", handleFormSubmit)
$("input[name=status]:radio").on("change", handleFormSubmit)
$("#slider-range").on("change", handleFormSubmit)
$("#cr-range").on("change", handleFormSubmit)

/**
 *  Process changes to the filter form and fetch monsters from the API
 */
async function handleFormSubmit(evt) {
    evt.preventDefault();

    const minCR = translateSliderRange($("#slider-range").slider("values", 0))[0];
    const maxCR = translateSliderRange($("#slider-range").slider("values", 1))[0];

    const type = $("#type-input").val();
    const size = $("#size-input").val();

    const status = $("input[name=status]:radio:checked").val();

    // console.debug(`Form submitted with:
    //     \n-- CR range = ${minCR} - ${maxCR}
    //     \n-- type = ${type}
    //     \n-- size = ${size}
    //     \n-- status = ${status}
    //     `);

    MONSTER_TABLE.updateSettings(
        minCR,
        maxCR,
        type,
        size,
        status
    );
}

$("#filter-form-reset-btn").on("click", function () {
    $("#slider-range").slider("values", 0, -3);
    $("#slider-range").slider("values", 1, 30);
    $("#type-input").val('');
    $("#size-input").val('');
    $("#status-both").prop('checked', true);

    // trigger a change
    $("#slider-range").trigger('change');
});

/**
 *  Challenge rating is filtered using a double-ended slider,
 *  which requires some additional logic
 */
// initialize
$("#cr-range").val("0 - 30");

// on slide
$("#slider-range").slider({
    animate: true,
    range: true,
    min: -3,
    max: 30,
    step: 1,
    values: [-3, 30],
    change: (event, ui) => updateSliderDisplay(event, ui),
    slide: (event, ui) => updateSliderDisplay(event, ui),
    stop: (event, ui) => updateSliderDisplay(event, ui)
});

function updateSliderDisplay(event, ui) {
    // update the UI element that shows the slider endpoints

    $("#cr-range").val(
        translateSliderRange(ui.values[0])[1] + " - " + translateSliderRange(ui.values[1])[1]
    );
    $("#cr-range").trigger('change');
}

function translateSliderRange(val) {
    // translate range [-3, 30] to [0, 30] with added fractions for 1/8, 1/4, 1/2

    const FRACTION_CRS = [
        [0.5, "1/2"],       // slider position 0
        [0.25, "1/4"],      // slider position 1
        [0.125, "1/8"],     // slider position 2
        [0, "0"]            // slider position 3
    ]

    if (val >= 1) {
        return [val, val.toString()];
    }
    else {
        // if value is [-3 - 0] lookup the opposite (+/-) value in the table
        return FRACTION_CRS[-val];
    }
}