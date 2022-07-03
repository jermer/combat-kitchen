

$('#monster-filter-form').submit(handleFormSubmit)

async function handleFormSubmit(evt) {
    evt.preventDefault();
    $('#monster-table').empty()

    // const cr = $('#cr-input').val();

    const minCR = translateSliderRange($("#slider-range").slider("values", 0))[0];
    const maxCR = translateSliderRange($("#slider-range").slider("values", 1))[0];

    const type = $("#type-input").val();

    // console.log(`Form submitted with CR = ${cr}`);
    console.log(`Form submitted with CR range = ${minCR} - ${maxCR} and type = ${type}`);

    const resp = await axios.get(`http://localhost:5000/api/monsters`, { params: { min_cr: minCR, max_cr: maxCR, type: type } });

    renderMonsterTable(resp.data.monsters)

}

function renderMonsterTable(monsters) {
    const $mtable = $('#monster-table')

    if (monsters.length === 0) {
        $mtable.append(`<tr scope="row"><td colspan="4">No monsters match match filter parameters.</td></tr>`);
        return;
    }

    for (m of monsters) {
        console.log(m.name)
        $mtable.append(renderMonsterTableRow(m))
        // $cupcakeList.append(formatCupcakeCard(c));
    }
}

function renderMonsterTableRow(monster) {
    return (`<tr scope="row">
        <td>${monster.name}</td>
        <td>${monster.size}</td>
        <td>${monster.cr}</td>
        <td>${monster.type}</td>
    </tr>`)
}

//
//  On page load, populate monster list
//
$(document).ready(populateMonsters);

async function populateMonsters() {
    const resp = await axios.get(`http://localhost:5000/api/monsters`, { params: { min_cr: 0, max_cr: 30 } });
    renderMonsterTable(resp.data.monsters)
}



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

const FRACTION_CRS = [
    [0.5, "1/2"],
    [0.25, "1/4"],
    [0.125, "1/8"],
    [0, "0"]
]