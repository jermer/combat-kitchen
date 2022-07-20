"use strict"

/** 
 *  Lookup table of XP tiers.
 *  Rows represent player level (1-20).
 *  Columns represent challenge level: [easy, medium, hard, deadly]
 */
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

/**
 *  Lookup table for encounter multipliers
 *  The challenge rating increases by a multiplier
 *  as the number of monsters increases
 */
const ENCOUNTER_MULTIPLIERS = [
    0,
    1,                  // 1 monster
    1.5,                // 2 monsters
    2, 2, 2, 2,         // 3-6 monsters
    2.5, 2.5, 2.5, 2.5, // 7-10 monsters
    3, 3, 3, 3,         // 11-14 monsters
    4                   // 15 monsters or more
]


// This is the global encounter panel
let ENCOUNTER_PANEL;

/**
 * EncounterPanel class
 */
class EncounterPanel {

    constructor() {
        this.monsterGroups = [];
        this.heroGroups = [{ num: 4, lvl: 1 }];

        // XP goals based on heroes in the encounter [easy, medium, hard, deadly]
        this.heroXP = [0, 0, 0, 0];

        // XP totals based on monsters in the encounter
        this.monsterTotalXP = 0;
        this.monsterAdjustedXP = 0;

        // Overall encounter difficulty [easy, medium, hard, deadly]
        this.encounterDifficulty = 'None';
    }

    /**
     *  Initialize a new encounter panel
     */
    initialize() {
        this.initializeEncounterHeroes();
        this.initializeEncounterMonsters();
        this.calculateHeroXP();
        this.updateHeroXPTable();
        this.calculateMonsterXP();
        this.updateMonsterXPTable();
        this.updatePerHeroXPTotals()
        this.updateEncounterChallenge();

        if (this.monsterGroups.length === 0) {
            // show the directions for adding monsters to the encounter and hide the monster list
            $('#encounter-table-help-text').show();
        }
        else {
            // hide the directions and show the monster list
            $('#encounter-table-help-text').hide();
        }
    }

    /**
     *  Populate the "heroes" section of the encounter panel
     *  with the heroes in session storage
     */
    initializeEncounterHeroes() {
        const storedHeroes = sessionStorage.getItem('stored_heroes');

        if (storedHeroes) {
            this.heroGroups = JSON.parse(storedHeroes);
        }

        for (let h of this.heroGroups) {
            $('#hero-list').append(
                this.renderEncounterHeroRow(h.num, h.lvl)
            );
        }
    }

    /**
     *  Populate the "monsters" section of the encounter panel
     *  with the monsters in session storage
     */
    initializeEncounterMonsters() {
        const storedMonsters = sessionStorage.getItem('stored_monsters');

        if (storedMonsters) {
            this.monsterGroups = JSON.parse(storedMonsters)
        }

        for (let m of this.monsterGroups) {
            $('#encounter-monster-list').append(
                this.renderEncounterMonsterRow(m, m.num)
            );
        }
    }

    /**
     *  Process changes made to the "HEROES" section of the encounter
     */
    updateEncounterHeroes() {
        this.updateHeroList();
        this.calculateHeroXP();
        this.updateHeroXPTable();
        this.updatePerHeroXPTotals()
        this.updateEncounterChallenge();
    }

    /**
     *  Process changes made to the "MONSTERS" section of the encounter
     */
    updateEncounterMonsters() {
        this.updateMonsterList();
        this.calculateMonsterXP();
        this.updateMonsterXPTable();
        this.updatePerHeroXPTotals()
        this.updateEncounterChallenge();

        if (this.monsterGroups.length === 0) {
            // show the directions for adding monsters to the encounter and hide the monster list
            $('#encounter-table-help-text').show();
        }
        else {
            // hide the directions and show the monster list
            $('#encounter-table-help-text').hide();
        }
    }

    /**
     *  Update the encounter challenge in the UI
     */
    updateEncounterChallenge() {
        this.determineChallengeLevel();
        $('#monster-xp-rating').text(this.encounterDifficulty);
    }

    /**
     *  Based on current heroes and monsters, determine whether this
     *  encounter is considererd easy, medium, hard, or deadly
     */
    determineChallengeLevel() {
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

    /**
     *  Update the "per hero" totals in the XP table
     */
    updatePerHeroXPTotals() {
        let numHeroes = this.heroGroups.reduce(
            (sum, grp) => sum + grp.num, 0
        );

        $('#monster-xp-total-per-hero').text(
            Math.round(this.monsterTotalXP / numHeroes)
        );
        $('#monster-xp-adjusted-per-hero').text(
            Math.round(this.monsterAdjustedXP / numHeroes)
        );
    }


    /**
     *  Changes in the DOM are propagated to the internal model
     */
    updateHeroList() {

        this.heroGroups = [];
        const heroRows = $('.hero-table-row');

        for (let row of heroRows) {
            let newHeroGroup = {};
            newHeroGroup.num = $(row).find(".hero-number-input").val();
            newHeroGroup.lvl = $(row).find(".hero-level-input").val();

            this.heroGroups.push(newHeroGroup);
        }
    }

    /**
     *  Changes in the DOM are propagated to the internal model
     */
    updateMonsterList() {
        this.monsterGroups = [];
        const monsterRows = $('.encounter-monster-row');

        for (let row of monsterRows) {
            let newMonsterGroup = {};
            newMonsterGroup.id = $(row).data("monster-id");
            newMonsterGroup.name = $(row).data("monster-name");
            newMonsterGroup.cr = $(row).data("monster-cr");
            newMonsterGroup.xp = $(row).data("monster-xp");
            newMonsterGroup.num = +$(row).find(".monster-number-input").val();

            this.monsterGroups.push(newMonsterGroup);
        }
    }

    /**
     *  Recalculate XP goals [easy, medium, hard, deadly] based
     *  on heroes currently in the encounter
     */
    calculateHeroXP() {

        const xpArr = this.heroGroups.reduce(function (xpArr, nextObj) {
            // console.log(nextObj);

            for (let i = 0; i < 4; i++) {
                xpArr[i] += nextObj.num * XP_TIERS[nextObj.lvl][i];
            }

            return xpArr;
        }, [0, 0, 0, 0]);

        // console.log(xpArr);
        this.heroXP = xpArr;

        // this.updateHeroXPTable();
    }

    /**
     *  Update DOM with new XP goals
     */
    updateHeroXPTable() {
        $('#hero-xp-table-easy').text(this.heroXP[0]);
        $('#hero-xp-table-medium').text(this.heroXP[1]);
        $('#hero-xp-table-hard').text(this.heroXP[2]);
        $('#hero-xp-table-deadly').text(this.heroXP[3]);
    }

    /**
     *  Recalculate XP total based on monsters currently in the encounter
     */
    calculateMonsterXP() {

        let numMonsters = 0;
        let totalXP = 0;

        // total the monsters' XP
        for (let m of this.monsterGroups) {
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

    /**
     *  Update DOM with new XP totals
     */
    updateMonsterXPTable() {
        $('#monster-xp-total').text(this.monsterTotalXP);
        $('#monster-xp-adjusted').text(this.monsterAdjustedXP);
    }

    /**
     *  Add a new monster to the encounter, either updating the count (if the monster
     *  already is part of the encounter), or adding a new monster.
     */
    addNewMonster(monster_id) {
        // check whether this monster id is already in the encounter
        const found_monster = this.monsterGroups.find(elt => elt.id === monster_id);

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

    /**
    *  Add a new hero group to the encounter
    */
    addHeroGroup() {
        $('#hero-list').append(
            this.renderEncounterHeroRow()
        );

        // update
        this.updateEncounterHeroes();
    }

    /**
     *  Generate the HTML for a new hero group in the encounter
     */
    renderEncounterHeroRow(num = 4, lvl = 1) {
        return (`
            <div class="row g-2 mb-1 justify-content-center hero-table-row">
                <div class="col-3">
                   <input type="number" min="1" value="${num}" class="form-control hero-list-control hero-number-input">
                </div>
                <div class="col-1 text-center">&times;</div>
                <div class="col-3">
                    <input type="number" min="1" max="20" value="${lvl}"
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

    /**
     *  Generate the HTML for a new monster group in the encounter
     */
    renderEncounterMonsterRow(monster, count = 1) {
        return (`
            <div class="row g-2 encounter-monster-row"
                data-monster-id="${monster.id}"
                data-monster-name="${monster.name}"
                data-monster-cr="${monster.cr}"
                data-monster-xp="${monster.xp}">

                <div class="col">
                    <div class="fw-bold">${monster.name}</div>
                    <small>
                        <p>(CR ${monster.cr}, XP ${monster.xp})</p>
                    </small>
                </div>

                <div class="col-3">
                    <input id="encounter-row-count-${monster.id}" type="number" class="form-control monster-number-input" min="1" value="${count}">
                </div>
    
                <div class="col-2 text-center">
                    <button class="btn btn-outline-danger encounter-row-delete-btn">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                </div>
            </div>
    `);
    }

} // end class EncounterPanel



/************************************************************
 * 
 *  ENCOUNTER PANEL UI ELEMENTS
 * 
 *  These elements handle updates to the encounter panel
 *  fully on the client side
 */

// add a new hero group to the encounter
$("#add-hero-group-btn").on("click", function (evt) {
    ENCOUNTER_PANEL.addHeroGroup();
    //ENCOUNTER_PANEL.updateEncounterHeroes();
});

// edit a hero group in the encounter
$("#hero-list").on("change", ".hero-list-control", function (evt) {
    ENCOUNTER_PANEL.updateEncounterHeroes();
});

// delete a hero group from the encounter
$("#hero-list").on("click", ".hero-row-delete-btn", function (evt) {
    $(this).closest('.row').remove();
    ENCOUNTER_PANEL.updateEncounterHeroes();
});

// edit a monster group in the encounter
$("#encounter-monster-list").on("change", ".monster-number-input", function (evt) {
    ENCOUNTER_PANEL.updateEncounterMonsters();
});

// delete a monster group from the encounter
$("#encounter-monster-list").on("click", ".encounter-row-delete-btn", function (evt) {
    $(this).closest('.row').remove();
    ENCOUNTER_PANEL.updateEncounterMonsters();
});


/************************************************************
 * 
 *  SAVE/LOAD ENCOUNTER
 * 
 *  These elements handle saving/loading encounters, which
 *  require requests to the API
 */

// save the current encounter to the user's encounter list
$("#save-encounter-btn").on("click", async function (evt) {
    const heroes = JSON.stringify(ENCOUNTER_PANEL.heroGroups)
    const monsters = JSON.stringify(ENCOUNTER_PANEL.monsterGroups)

    console.debug(`sending... ${heroes} // ${monsters}`);

    // add to session storage
    sessionStorage.setItem('stored_heroes', heroes)
    sessionStorage.setItem('stored_monsters', monsters)

    if (window.currentUser.id > 0) {
        // send to the db for long term storage
        const resp = await axios.post(`/users/${window.currentUser.id}/save`, {
            heroes: heroes,
            monsters: monsters
        })
    }
    else {
        window.location.replace("/login");
    }
});
