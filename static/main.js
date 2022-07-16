"use strict"

/**
 * One the DOM is loaded, launch the app
 */
$(document).ready(async function () {

    // Create and initialize a new encounter panel
    ENCOUNTER_PANEL = new EncounterPanel();
    ENCOUNTER_PANEL.initialize();

    // Create and initialize a new monster table
    MONSTER_TABLE = new MonsterTable();
    await MONSTER_TABLE.initialize();

    // Enable tooltips
    const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]')
    const tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl))

    // Enable toasts (flash messages)
    $('.toast').toast('show');

});
