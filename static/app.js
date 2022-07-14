
/**
 * CONSTANTS AND SETTINGS
 */

// Lookup table of XP tiers.
// Rows represent player level (1-20).
// Columns represent challenge level:
//      [easy, medium, hard, deadly]
const XP_TIERS = [
    [0, 0, 0, 0],
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

const ENCOUNTER_MULTIPLIERS = [
    0,
    1,  // 1 monster
    1.5, // 2 monsters
    2, 2, 2, 2, // 3-6 monsters
    2.5, 2.5, 2.5, 2.5, // 7-10 monsters
    3, 3, 3, 3, // 11-14 monsters
    4 // 15 monsters or more
]

/**
 * MonsterTable class
 * 
 */

class MonsterTable {

    constructor() {
        this.page = 1;
        this.resultsPerPage = 10;

        this.minCR = 0;
        this.maxCR = 30;
        this.type = "";

        this.HTMLtable = $('#monster-table-body');

        this.allMonsters = [];
        this.monsters = [];
    }

    async updateSettings(minCR, maxCR, type) {
        this.minCR = minCR;
        this.maxCR = maxCR;
        this.type = type;

        this.page = 1;

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
        this.heroGroups = [{ num: 4, lvl: 1 }];

        // XP goals based on heroes in the encounter [easy, medium, hard, deadly]
        this.heroXP = [0, 0, 0, 0];

        // XP totals based on monsters in the encounter
        this.monsterTotalXP = 0;
        this.monsterAdjustedXP = 0;

        // Overall encounter difficulty [easy, medium, hard, deadly]
        this.encounterDifficulty = 'None';
    }

    updateEncounterHeroes() {
        // process changes made to the "HEROES" section of the encounter

        this.updateHeroList();
        this.calculateHeroXP();
        this.updateHeroXPTable();
        this.updateEncounterChallenge();
    }

    updateEncounterMonsters() {
        // process changes made to the "MONSTERS" section of the encounter

        this.updateMonsterList();
        this.calculateMonsterXP();
        this.updateMonsterXPTable();
        this.updateEncounterChallenge();

        if (this.monsters.length === 0) {
            // show the directions for adding monsters to the encounter and hide the monster list
            $('#encounter-table-help-text').show();
            $('#encounter-monster-list').hide();
        }
        else {
            // hide the directions and show the monster list
            $('#encounter-table-help-text').hide();
            $('#encounter-monster-list').show();
        }
    }

    updateEncounterChallenge() {
        // update the encounter challenge (easy, medium, hard, deadly) based on changes to "heroes" or "monsters"

        this.determineChallengeLevel();
        $('#monster-xp-rating').text(this.encounterDifficulty);
    }

    updateHeroList() {
        // get values from the DOM and update the internal list of heroes

        this.heroGroups = [];
        const heroRows = $('.hero-table-row');

        for (let row of heroRows) {
            let newHeroGroup = {};
            newHeroGroup.num = $(row).find(".hero-number-input").val();
            newHeroGroup.lvl = $(row).find(".hero-level-input").val();

            this.heroGroups.push(newHeroGroup);
        }
    }

    calculateHeroXP() {
        // recalculate XP goals [easy, medium, hard, deadly] based on heroes currently in the encounter

        const xpArr = this.heroGroups.reduce(function (xpArr, nextObj) {
            console.log(nextObj);

            for (let i = 0; i < 4; i++) {
                xpArr[i] += nextObj.num * XP_TIERS[nextObj.lvl][i];
            }

            return xpArr;
        }, [0, 0, 0, 0]);

        // console.log(xpArr);
        this.heroXP = xpArr;

        this.updateHeroXPTable();
    }

    updateHeroXPTable() {
        // update DOM with new XP goals

        $('#hero-xp-table-easy').text(this.heroXP[0]);
        $('#hero-xp-table-medium').text(this.heroXP[1]);
        $('#hero-xp-table-hard').text(this.heroXP[2]);
        $('#hero-xp-table-deadly').text(this.heroXP[3]);
    }

    addHeroGroup() {
        // add a new hero group to the DOM

        $('#hero-list').append(
            this.renderEncounterHeroRow()
        );
    }

    renderEncounterHeroRow() {
        // render the HTML for a new hero row

        return (`
            <div class="row g-2 mb-1 justify-content-center hero-table-row">
               <div class="col-3">
                   <input type="number" min="1" value="4" class="form-control hero-list-control hero-number-input">
                </div>
                <div class="col-1 text-center">&times;</div>
                <div class="col-3">
                    <input type="number" min="1" max="20" value="1"
                    class="form-control hero-list-control hero-level-input">
                </div>
                <div class="col-2 text-center">
                    <button class="btn btn-outline-danger hero-row-delete-btn">
                    <i class="fa-solid fa-trash-can"></i>
                    </button>
                </div>
            </div>
        `)
    }

    updateMonsterList() {
        // get values from the DOM and update the internal list of heroes

        this.monsters = [];
        const monsterRows = $('.encounter-monster-row');

        for (let row of monsterRows) {
            let newMonsterGroup = {};
            newMonsterGroup.id = $(row).data("monster-id");
            newMonsterGroup.xp = $(row).data("monster-xp");
            newMonsterGroup.num = +$(row).find(".monster-number-input").val();

            this.monsters.push(newMonsterGroup);
        }
    }

    addNewMonster(monster_id) {
        // add a new monster to the encounter: either update the count (if the monster already is part) of the encounter, or add it.

        // check whether this monster id is already in the encounter
        const found_monster = this.monsters.find(elt => elt.id === monster_id);

        if (found_monster) {
            // this monster is already included in the encounter
            // all we need to do is update the count
            found_monster.num++;
            $(`#encounter-row-count-${monster_id}`).val(found_monster.num);

        } else {
            // this monster is new to the encounter
            // we need to add it to the DOM
            const full_monster = MONSTER_TABLE.monsters.find(elt => elt.id === monster_id)

            const new_monster = {
                id: full_monster.id,
                name: full_monster.name,
                cr: full_monster.cr,
                xp: full_monster.xp,
                num: 1
            };

            $('#encounter-monster-list').append(
                ENCOUNTER_PANEL.renderEncounterMonsterRow(new_monster)
            );
        }

        // update
        this.updateEncounterMonsters();
    }

    calculateMonsterXP() {
        // recalculate XP total based on monsters currently in the encounter

        let numMonsters = 0;
        let totalXP = 0;

        // total the monsters' XP
        for (let m of this.monsters) {
            numMonsters += m.num;
            totalXP += (m.xp * m.num);
        }

        // adjust the XP based on number of monsters
        // and the number of PCs
        let adjustedXP = totalXP * (
            numMonsters > 15 ? 4 :
                ENCOUNTER_MULTIPLIERS[numMonsters]
        );

        this.monsterTotalXP = totalXP;
        this.monsterAdjustedXP = adjustedXP;
    }

    updateMonsterXPTable() {
        // update DOM wiht new XP totals

        $('#monster-xp-total').text(this.monsterTotalXP);
        $('#monster-xp-adjusted').text(this.monsterAdjustedXP);
    }

    determineChallengeLevel() {
        // based on current heroes and monsters, determine whether this encounter is considererd easy, medium, hard, or deadly

        if (this.monsterAdjustedXP === 0 || this.heroGroups.length === 0) {
            this.encounterDifficulty = "NONE";
        }
        else if (this.monsterAdjustedXP < this.heroXP[1]) {
            this.encounterDifficulty = "EASY";
        }
        else if (this.monsterAdjustedXP < this.heroXP[2]) {
            this.encounterDifficulty = "MEDIUM";
        }
        else if (this.monsterAdjustedXP < this.heroXP[3]) {
            this.encounterDifficulty = "HARD";
        }
        else {
            this.encounterDifficulty = "DEADLY";
        }
    }

    renderEncounterMonsterRow(monster) {
        // render the HTML for a new monster row in the encounter

        return (`
            <div class="row g-2 encounter-monster-row" data-monster-id="${monster.id}" data-monster-xp="${monster.xp}">
                <div class="col">
                    <div class="fw-bold">${monster.name}</div>
                    <small>
                        <p>(CR ${monster.cr}, XP ${monster.xp})</p>
                    </small>
                </div>

                <div class="col-3">
                    <input id="encounter-row-count-${monster.id}" type="number" class="form-control monster-number-input" min="1" value="1">
                </div>
    
                <div class="col-2 text-center">
                    <button class="btn btn-outline-danger encounter-row-delete-btn">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                </div>
            </div>
    `);
    }


    loadEncounter(heroList, monsterList) {
        // input is two strings in JSON format

        heroList = `[{"num":"4","lvl":"3"},{"num":"4","lvl":"1"}]`;
        monsterList = `[{"id":49,"xp":50,"num":3},{"id":304,"xp":11500,"num":1}]`;

        ENCOUNTER_PANEL.heroGroups = JSON.parse(heroList);
        ENCOUNTER_PANEL.monsters = JSON.parse(monsterList);

    }

} // end class EncounterPanel


/*
 *  CLIENT-SIDE INTERFACE ELEMENTS
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
        // const resultsPerPage = $(this).val();
        MONSTER_TABLE.resultsPerPage = $(this).val();;
        MONSTER_TABLE.updateView();
    });

// Text search input
$("#text-search-input").on("keyup",
    function (evt) {
        evt.preventDefault();
        MONSTER_TABLE.updateView();
    });


/**
 *  MONSTER SEARCH FORM
 * 
 */
$('#monster-filter-form').submit(handleFormSubmit)
$("#type-input").on("change", handleFormSubmit)
$("#amount").on("change", handleFormSubmit)

async function handleFormSubmit(evt) {
    evt.preventDefault();

    const minCR = translateSliderRange($("#slider-range").slider("values", 0))[0];
    const maxCR = translateSliderRange($("#slider-range").slider("values", 1))[0];

    const type = $("#type-input").val();

    console.debug(`Form submitted with:
        \n-- CR range = ${minCR} - ${maxCR}
        \n-- type = ${type}
        `);

    MONSTER_TABLE.updateSettings(
        minCR,
        maxCR,
        type
    );
}


/**
 * Clicking the "arrow" icon in the monster table adds that
 * monster to the current encounter.
 */
$("#monster-table tbody").on("click", ".add-to-encounter",
    function (evt) {
        var monster_id = $(this).closest('tr').data('mid');
        ENCOUNTER_PANEL.addNewMonster(monster_id);
    });


/**
 * Clicking the "eye" icon in the monster table triggers a pop-up
 * dialog containing the monster's stat block.
 */
$("#monster-table tbody").on("click", ".monster-detail",
    async function (evt) {
        var monster_id = $(this).closest('tr').data('mid');

        const resp = await axios.get(`http://localhost:5000/api/monsters/${monster_id}`)

        $('#monsterModal .modal-body')
            .empty()
            .html(resp.data)

        const monsterModal = $('#monsterModal');
        const bsModal = new bootstrap.Modal(monsterModal)
        bsModal.show();
    });


/**
 * Version 2 Feature Idea
 * Clicking the "pen" icon int he monster table allows the user
 * to edit the monster's stat block.
 */
// $("#monster-table tbody").on("click", ".edit-monster", editMonster)
//
// function editMonster(evt) {
//     var monster_id = $(this).closest('tr').data('mid');
//     alert(`Click to EDIT monster with id = ${monster_id}`)
// }


$("#encounter-monster-list").on("click", ".encounter-row-delete-btn", function (evt) {
    $(this).closest('.row').remove();
    ENCOUNTER_PANEL.updateEncounterMonsters();
});

$("#encounter-monster-list").on("change", ".monster-number-input", function (evt) {
    ENCOUNTER_PANEL.updateEncounterMonsters();
});


$("#hero-list").on("change", ".hero-list-control", function (evt) {
    ENCOUNTER_PANEL.updateEncounterHeroes();
});

$("#add-hero-group-btn").on("click", function (evt) {
    ENCOUNTER_PANEL.addHeroGroup();
    ENCOUNTER_PANEL.updateEncounterHeroes();
});

$("#hero-list").on("click", ".hero-row-delete-btn", function (evt) {
    $(this).closest('.row').remove();
    ENCOUNTER_PANEL.updateEncounterHeroes();
});


$("#save-encounter-btn").on("click", function (evt) {
    console.debug(
        JSON.stringify(ENCOUNTER_PANEL.heroGroups),
        JSON.stringify(ENCOUNTER_PANEL.monsters)
    );
});


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
    ENCOUNTER_PANEL.updateEncounterHeroes();
    ENCOUNTER_PANEL.updateEncounterMonsters();

    MONSTER_TABLE = new MonsterTable();
    await MONSTER_TABLE.queryMonsters();
    MONSTER_TABLE.updateView();

    const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]')
    const tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl))
});