"use strict"

/**
 * One the DOM is loaded, launch the app
 */
$(document).ready(async function () {

    // Create and initialize a new encounter panel
    ENCOUNTER_PANEL = new EncounterPanel();
    ENCOUNTER_PANEL.InitializeEncounterHeroes();
    ENCOUNTER_PANEL.InitializeEncounterMonsters();


    ENCOUNTER_PANEL.calculateHeroXP();
    ENCOUNTER_PANEL.updateHeroXPTable();
    ENCOUNTER_PANEL.calculateMonsterXP();
    ENCOUNTER_PANEL.updateMonsterXPTable();
    ENCOUNTER_PANEL.updateEncounterChallenge();

    if (ENCOUNTER_PANEL.monsters.length === 0) {
        // show the directions for adding monsters to the encounter and hide the monster list
        $('#encounter-table-help-text').show();
    }
    else {
        // hide the directions and show the monster list
        $('#encounter-table-help-text').hide();
    }

    MONSTER_TABLE = new MonsterTable();
    await MONSTER_TABLE.queryMonsters();
    MONSTER_TABLE.updateView();


    // Enable tooltips
    const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]')
    const tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl))

    // Enable toasts (flash messages)
    $('.toast').toast('show');

});
