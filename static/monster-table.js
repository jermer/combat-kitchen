
//
// NVM
//

// class MonsterTable {

//     constructor() {
//         this.page = 1;
//         this.resultsPerPage = 5;

//         this.minCR = 0;
//         this.maxCR = 30;
//         this.type = "";

//         this.HTMLtable = $('#monster-table-body');

//         this.monsters = [];
//     }

//     async updateSettings(minCR, maxCR, type, resultsPerPage) {
//         this.minCR = minCR;
//         this.maxCR = maxCR;
//         this.type = type;

//         this.page = 1;
//         this.resultsPerPage = resultsPerPage;

//         await this.queryMonsters();
//         this.updateView();
//     }

//     /*
//      *   Query the API based on the current settings
//      */
//     async queryMonsters() {
//         const params = {
//             min_cr: this.minCR,
//             max_cr: this.maxCR,
//             type: this.type
//         }

//         // get updated monster list from the api
//         const resp = await axios.get(`http://localhost:5000/api/monsters`, { params: params });

//         // this.monsters = JSON.parse(JSON.stringify(resp.data.monsters));
//         this.monsters = resp.data.monsters;
//     }

//     /*
//      *  Update the UI
//      */
//     updateView() {
//         // render the new table
//         this.renderMonsterTable(this.monsters)

//         console.debug(`page = ${this.page}`)

//         // update pagination buttons
//         if (this.page === 1) {
//             $('#table-prev-btn').parent().addClass('disabled');
//         }
//         else {
//             $('#table-prev-btn').parent().removeClass('disabled');
//         }

//         const maxPages = Math.ceil(this.monsters.length / this.resultsPerPage);
//         if (this.page === maxPages) {
//             $('#table-next-btn').parent().addClass('disabled');
//         }
//         else {
//             $('#table-next-btn').parent().removeClass('disabled');
//         }
//     }

//     /* 
//      *  Update the monster table
//      */
//     renderMonsterTable(monsters) {
//         // empty the table
//         this.HTMLtable.empty();

//         // print a helpful message if no monsters
//         if (monsters.length === 0) {
//             this.HTMLtable.append(`<tr scope="row"><td colspan="4">No monsters match match filter parameters.</td></tr>`);
//             return;
//         }

//         // determine starting monster based on pagination
//         const start = (this.page - 1) * (this.resultsPerPage);

//         for (let i = 0; i < this.resultsPerPage && start + i < monsters.length; i++) {
//             let m = monsters[start + i];
//             this.HTMLtable.append(this.renderMonsterTableRow(m));
//         }
//     }

//     /*
//      *  Render HTML for a table row
//      */
//     renderMonsterTableRow(monster) {
//         return (`<tr scope="row" data-mid="${monster.id}">
//             <td>
//                 <a href="#"><i class="fa-solid fa-circle-arrow-left add-to-encounter" title="add to encounter"></i></a>

//                <a href="#" class="monster-detail"><i class="fa-solid fa-eye" title="view stat block"></i></a>

//                 <a href="#"><i class="fa-solid fa-pen-nib edit-monster" title="edit monster"></i></a>
//             </td>
//             <td>${monster.name}</td>
//             <td>${monster.size}</td>
//             <td>${monster.cr}</td>
//             <td>${monster.type}</td>
//         </tr>`)
//     }

//     /* 
//      *  Logic for pagination
//      */
//     showNextPage() {
//         this.page++;
//         this.updateView();
//     }

//     showPrevPage() {
//         this.page--;
//         this.updateView();
//     }
// }