// A puzzle is described by an object with the following fields:
//  - width: a number giving the width of the grid.
//  - height: a number giving the height of the grid.
//  - digits: an array of valid digits (as strings).
//  - regions: an array of regions (or boxes).
//  - givens: an array of given digits.
//
// A region is an object with the following fields:
//  - x: the starting x position of the region description.
//  - y: the starting y position of the region description.
//  - path: an array of numbers giving distances along the current direction.
//
// The first number in the path gives an horizontal distance. Its direction is
// given by its sign: positive means east, negative means west. Then, the next
// number gives a vertical distance: south if it is positive, north otherwise.
// the remaining numbers alternate between horizontal and vertical distances.
//
// A given number is an object with the following fields:
//  - x: the x coordinate of the number in the grid.
//  - y: the y coordinate of the number in the grid.
//  - digit: the actual digit as a string.

// Gives the description of a standard 9x9 sudoku with the given givens.
function standard_sudoku_descr(givens){
  var descr = {
    width: 9,

    height: 9,

    digits: ["1", "2", "3", "4", "5", "6", "7", "8", "9"],

    regions: [
      {x: 0, y: 0, path: [3, 3, -3, -3]},
      {x: 3, y: 0, path: [3, 3, -3, -3]},
      {x: 6, y: 0, path: [3, 3, -3, -3]},
      {x: 0, y: 3, path: [3, 3, -3, -3]},
      {x: 3, y: 3, path: [3, 3, -3, -3]},
      {x: 6, y: 3, path: [3, 3, -3, -3]},
      {x: 0, y: 6, path: [3, 3, -3, -3]},
      {x: 3, y: 6, path: [3, 3, -3, -3]},
      {x: 6, y: 6, path: [3, 3, -3, -3]}
    ],

    cages: [],

    thermos: [],

    kropki_dots: [],

    givens,
  };

  return descr;
}

// Gives the description of a standard 9x9 killer sudoku (with no givens).
function standard_killer_descr(cages){
  var descr = {
    width: 9,

    height: 9,

    digits: ["1", "2", "3", "4", "5", "6", "7", "8", "9"],

    regions: [
      {x: 0, y: 0, path: [3, 3, -3, -3]},
      {x: 3, y: 0, path: [3, 3, -3, -3]},
      {x: 6, y: 0, path: [3, 3, -3, -3]},
      {x: 0, y: 3, path: [3, 3, -3, -3]},
      {x: 3, y: 3, path: [3, 3, -3, -3]},
      {x: 6, y: 3, path: [3, 3, -3, -3]},
      {x: 0, y: 6, path: [3, 3, -3, -3]},
      {x: 3, y: 6, path: [3, 3, -3, -3]},
      {x: 6, y: 6, path: [3, 3, -3, -3]}
    ],

    cages,

    thermos: [],

    kropki_dots: [],

    givens: [],
  };

  return descr;
}

// Convert regions given by border into lists of cells.
function cells_of_regions(w, h, regions){
  // Create an array of cells initialized with [-1].
  var cells = new Array(w);
  for(var x = 0; x < w; x++){
    cells[x] = new Array(h);
    for(var y = 0; y < h; y++){
      cells[x][y] = -1;
    }
  }

  function is_empty(x, y){
    return cells[x][y] == -1;
  }

  // For each region, write its index in [regions] in the cells of its border.
  for(var i = 0; i < regions.length; i++){
    var x = regions[i].x;
    var y = regions[i].y;
    var horiz = true;

    for(j = 0; j < regions[i].path.length; j++){
      var n = regions[i].path[j];
      var pos = n >= 0;
      if(n < 0) n = -n;

      for(k = 0; k < n; k++){
        if(horiz){
          if(pos){
            x++;
            cells[x-1][y] = i;
          } else {
            x--;
            cells[x][y-1] = i;
          }
        } else {
          if(pos){
            y++;
            cells[x-1][y] = i;
          } else {
            y--;
            cells[x][y] = i;
          }
        }
      }

      horiz = !horiz;
    }
  }

  // For each unassigned cell, assign the first region in all directions.
  // We test all directions to support grids that are not covered by regions.
  for(var x = 0; x < w; x++){
    for(var y = 0; y < h; y++){
      if(is_empty(x, y)){
        var x_l = x; // left
        var x_r = x; // right
        var y_t = y; // top
        var y_b = y; // bottom

        while(x_l > 0 && is_empty(x_l, y)) x_l--;
        while(x_r < w && is_empty(x_r, y)) x_r++;
        while(y_t > 0 && is_empty(x, y_t)) y_t--;
        while(y_b < h && is_empty(x, y_b)) y_b++;

        var v_w = cells[x_l][y];
        var v_e = cells[x_r][y];
        var v_n = cells[x][y_t];
        var v_s = cells[x][y_b];

        var v = Math.max(v_w, v_e, v_n, v_s);

        if(v_w == -1 || v_w == v){
          if(v_e == -1 || v_e == v){
            if(v_n == -1 || v_n == v){
              if(v_s == -1 || v_s == v){
                cells[x][y] = v;
              }
            }
          }
        }
      }
    }
  }

  // We gather the cells for each region.
  var res = new Array(regions.length);
  for(var i = 0; i < regions.length; i++) res[i] = new Array();

  for(var x = 0; x < w; x++){
    for(var y = 0; y < h; y++){
      if(!is_empty(x, y)){
        res[cells[x][y]].push({x: x, y: y});
      }
    }
  }

  return res;
}

// Gives the path between [p_orig] (excluded) and [p_dest] (included).
function build_path(p_orig, p_dest){
  var res = new Array();

  if(p_orig.x == p_dest.x){
    if(p_orig.y < p_dest.y){
      // Vertical path, going downwards.
      for(var y = p_orig.y + 1; y <= p_dest.y; y++){
        res.push({x: p_orig.x, y: y});
      }
    } else {
      // Vertical path, going upwards.
      for(var y = p_orig.y - 1; y >= p_dest.y; y--){
        res.push({x: p_orig.x, y: y});
      }
    }
  } else if(p_orig.y == p_dest.y){
    if(p_orig.x < p_dest.x){
      // Horizontal path, going to the right.
      for(var x = p_orig.x + 1; x <= p_dest.x; x++){
        res.push({x: x, y: p_orig.y});
      }
    } else {
      // Horizontal path, going to the left.
      for(var x = p_orig.x - 1; x >= p_dest.x; x--){
        res.push({x: x, y: p_orig.y});
      }
    }
  } else {
    res.push(p_dest); // TODO properly handle diagonal paths.
  }

  return res;
}

// Convert thermometers in lists of cells (starting at the bulb).
function cells_of_thermos(thermos){
  var res = new Array(thermos.length);

  for(var i = 0; i < thermos.length; i++){
    res[i] = new Array();

    var p = thermos[i].bulb;
    res[i].push(p);

    for(var j = 0; j < thermos[i].path.length; j++){
      build_path(p, thermos[i].path[j]).forEach(function(p){
        res[i].push(p);
      });

      p = thermos[i].path[j];
    }
  }

  return res;
}

// Game creation function.
// Arguments:
//   - id: id of the element in which to append the sudoku.
//   - descr: description of the puzzle as an object.
function make_sudoku(id, descr){
  // Obtain the element in which to append the sudoku.
  var container = document.getElementById(id);

  // Create the main div for the sudoku.
  var main_div = document.createElement("div");
  main_div.classList.add("puzzle");
  container.append(main_div);

  // Create the overlay and underlay images (used for thermos and the likes).
  var overlay = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  overlay.classList.add("overlay");
  overlay.classList.add("foreground");

  var underlay = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  underlay.classList.add("overlay");
  underlay.classList.add("background");

  // Width and height of the grid.
  var w = descr.width;
  var h = descr.height;

  // Initialize the array of cells.
  var cells = new Array(w);
  for(var x = 0; x < w; x++){
    cells[x] = new Array(h);

    for(var y = 0; y < h; y++){
      var c = document.createElement("td");
      c.classList.add("cell");

      var val = document.createElement("span");
      val.classList.add("value");
      c.append(val);

      var center_m = document.createElement("span");
      center_m.classList.add("centerMark");
      c.append(center_m);

      var corner_m = document.createElement("span");
      corner_m.classList.add("cornerMark");
      c.append(corner_m);

      cells[x][y] = {
        cell: c,
        value: val,
        center_mark: center_m,
        corner_mark: corner_m,
      };
    }
  }

  // Construct the grid.
  var grid = document.createElement("table");
  grid.classList.add("grid");
  for(y = 0; y < h; y++){
    var line = document.createElement("tr");
    line.classList.add("line");
    grid.append(line);

    for(x = 0; x < w; x++){
      line.append(cells[x][y].cell);
    }
  }

  // Put everything in the main div.
  main_div.append(underlay);
  main_div.append(grid);
  main_div.append(overlay);

  // For each cell, was it given at the start?
  var given = new Array(w);
  for(var x = 0; x < w; x++){
    given[x] = new Array(h);
    for(var y = 0; y < h; y++){
      given[x][y] = false;
    }
  }

  // Add the givens.
  function add_given(g){
    given[g.x][g.y] = true;
    cells[g.x][g.y].value.innerHTML = g.digit;
    cells[g.x][g.y].value.style.color = "#000000";
  }
  descr.givens.forEach(add_given);

  // Add the regions.
  function add_region(r) {
    var x = r.x;
    var y = r.y;
    var horiz = true;

    function add_border(x, y, dir){
      if(x < 0 || w+1 < x || y < 0 || h+1 < y){
        console.log("Invalid border (starting at (", x, ",", y, ")).");
        return;
      }
      switch(dir){
        case 0: // east
          if(x == w){
            console.log("Invalid border (out of the grid to the east).");
            return;
          }
          if(y < h){
            cells[x][y].cell.style.borderTop = "3px solid black";
          } else {
            // On south grid border.
            cells[x][y-1].cell.style.borderBottom = "3px solid black";
          }
          break
        case 1: // south
          if(y == h){
            console.log("Invalid border (out of the grid to the south).");
            return;
          }
          if(x > 0){
            cells[x-1][y].cell.style.borderRight = "3px solid black";
          } else {
            // On west grid border.
            cells[x][y].cell.style.borderLeft = "3px solid black";
          }
          break
        case 2: // west
          if(x == 0){
            console.log("Invalid border (out of the grid to the west).");
            return;
          }
          if(y < h){
            cells[x-1][y].cell.style.borderTop = "3px solid black";
          } else {
            // On south grid border.
            cells[x-1][y-1].cell.style.borderBottom = "3px solid black";
          }
          break
        case 3: // north
          if(y == 0){
            console.log("Invalid border (out of the grid to the north).");
            return;
          }
          if(x > 0){
            cells[x-1][y-1].cell.style.borderRight = "3px solid black";
          } else {
            // On east grid border.
            cells[x][y-1].cell.style.borderLeft = "3px solid black";
          }
          break
      }
    }

    for(var i = 0; i < r.path.length; i++){
      var n = r.path[i];

      // Compute the direction.
      if(horiz){
        if(n > 0){ // going east
          for(var k = 0; k < n; k++){
            add_border(x, y, 0); x++;
          }
        } else {   // going west
          for(var k = 0; k < -n; k++){
            add_border(x, y, 2); x--;
          }
        }
      } else {
        if(n > 0){ // going south
          for(var k = 0; k < n; k++){
            add_border(x, y, 1); y++;
          }
        } else {   // going north
          for(var k = 0; k < -n; k++){
            add_border(x, y, 3); y--;
          }
        }
      }

      horiz = !horiz;
    }
  }
  descr.regions.forEach(add_region);

  // Compute regions.
  var regions = cells_of_regions(descr.width, descr.height, descr.regions);

  // Utility function to get the center of a cell.
  function cell_center(x, y){
    var cell_offset = cells[x][y].cell.getBoundingClientRect();
    var grid_offset = grid.getBoundingClientRect();

    return {
      x: cell_offset.left - grid_offset.left + cell_offset.width  / 2,
      y: cell_offset.top  - grid_offset.top  + cell_offset.height / 2,
    };
  }

  // Paint the thermometers on the underlay.
  function add_thermo(t){
    var c = cell_center(t.bulb.x, t.bulb.y);

    var bulb = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    bulb.setAttribute('cx', c.x);
    bulb.setAttribute('cy', c.y);
    bulb.setAttribute('r', 18);
    bulb.setAttribute('fill', "#C4C4C4");
    underlay.append(bulb);

    if(t.path.length != 0){
      var path = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
      path.setAttribute('fill', "none");
      path.setAttribute('stroke', "#C4C4C4");
      path.setAttribute('stroke-linecap', "round");
      path.setAttribute('stroke-width', 16);

      var points = c.x + "," + c.y;
      function add_point(p){
        var c = cell_center(p.x, p.y);
        points = points + " " + c.x + "," + c.y;
      }
      t.path.forEach(add_point);

      path.setAttribute('points', points);
      underlay.append(path);
    }
  }
  descr.thermos.forEach(add_thermo);

  // Compute thermos
  var thermos = cells_of_thermos(descr.thermos);

  // Code to light up thermo cells (for debug).
  //thermos.forEach(function(t){
  //  t.forEach(function(p){
  //    cells[p.x][p.y].cell.style.backgroundColor = "purple";
  //  });
  //});

  // Paint the kropki dots on the overlay.
  function add_dots(dots){
    if(dots.path.length < 2){
      console.log("Invalid kropki dot spec.");
      return;
    }

    for(var i = 0; i < dots.path.length - 1; i++){
      var c1 = cell_center(dots.path[i  ].x, dots.path[i  ].y);
      var c2 = cell_center(dots.path[i+1].x, dots.path[i+1].y);
      var x = (c1.x + c2.x) / 2;
      var y = (c1.y + c2.y) / 2;

      var d = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      d.setAttribute('cx', x);
      d.setAttribute('cy', y);
      d.setAttribute('r', 6);
      d.setAttribute('stroke', "black");
      d.setAttribute('stroke-width', 2);
      d.setAttribute('fill', dots.kind);
      overlay.append(d);
    }
  }
  descr.kropki_dots.forEach(add_dots);

  // Add the cages.
  function add_cage(r) {
    var x = r.x;
    var y = r.y;
    var horiz = true;

    // TODO how exactly?
    console.log(r.path);
  }
  descr.cages.forEach(add_cage);

  // How many digits have been entered so far?
  var nb_digits = descr.givens.length;

  // Check if the grid is fully filled.
  function check_ready(){
    return (nb_digits == descr.width * descr.height);
  }

  // Checking function
  function check_solution(){
    // Check that all digits have been entered.
    if(!check_ready()){
      return "There are still digits to fill in!";
    }

    var digits = descr.digits.sort().join('');

    // Check the lines.
    for(var y = 0; y < descr.height; y++){
      var used = "";

      for(var x = 0; x < descr.width; x++){
        used = used + cells[x][y].value.innerHTML;
      }

      used = used.split('').sort().join('');

      if(!(used === digits)){
        return "There is a duplicated digit in line " + (y+1) + "...";
      }
    }

    // Check the columns.
    for(var x = 0; x < descr.width; x++){
      var used = "";

      for(var y = 0; y < descr.height; y++){
        used = used + cells[x][y].value.innerHTML;
      }

      used = used.split('').sort().join('');

      if(!(used === digits)){
        return "There is a duplicated digit in column " + (x+1) + "...";
      }
    }

    // Check the regions.
    for(var i = 0; i < regions.length; i++){
      var used = "";

      for(j = 0; j < regions[i].length; j++){
        var x = regions[i][j].x;
        var y = regions[i][j].y;
        used = used + cells[x][y].value.innerHTML;
      }

      used = used.split('').sort().join('');

      if(!(used === digits)){
        return "There is a duplicated digit in box " + (i+1) + "...";
      }
    }

    // Check the thermos.
    for(var i = 0; i < thermos.length; i++){
      for(var j = 0; j < thermos[i].length - 1; j++){
        var p1 = thermos[i][j];
        var p2 = thermos[i][j+1];
        var v1 = parseInt(cells[p1.x][p1.y].value.innerHTML, 10);
        var v2 = parseInt(cells[p2.x][p2.y].value.innerHTML, 10);

        if(v1 >= v2){
          return "There is a problem with a thermometer...";
        }
      }
    }

    // Check the kropki dots.
    for(let dots of descr.kropki_dots){
      for(var i = 0; i < dots.path.length - 1; i++){
        var p1 = dots.path[i];
        var p2 = dots.path[i+1];
        var v1 = parseInt(cells[p1.x][p1.y].value.innerHTML, 10);
        var v2 = parseInt(cells[p2.x][p2.y].value.innerHTML, 10);

        if(dots.kind === "white" && Math.max(v1, v2) != Math.min(v1, v2) + 1){
          return "There is a problem with a white kropki dot...";
        }

        if(dots.kind === "black" && Math.max(v1, v2) != Math.min(v1, v2) * 2){
          return "There is a problem with a black kropki dot...";
        }
      }
    }

    return "Looks good to me!";
  }

  // Return object initialization.
  var retval = {
    is_ready: check_ready,
    do_check: check_solution,
  };

  // Selected cells.
  var selected = new Array(w);
  for(var x = 0; x < w; x++){
    selected[x] = new Array(h);
    for(var y = 0; y < h; y++){
      selected[x][y] = false;
    }
  }

  // Number of selected cells.
  var selection_size = 0;

  // Currently selecting?
  var selecting = false;

  // Are we deselection?
  var deselecting = false;

  // When ctrl is pressed, add on top of the current selection.
  var ctrl_pressed = false;
  var shift_pressed = false;

  function select_cell(x, y){
    if(!selected[x][y] && !deselecting){
      selected[x][y] = true;
      selection_size++;
      cells[x][y].cell.classList.add("selected");
    }

    if(selected[x][y] && deselecting){
      selected[x][y] = false;
      selection_size--;
      cells[x][y].cell.classList.remove("selected");
    }
  }

  function clear_selection(){
    for(var x = 0; x < w; x++){
      for(var y = 0; y < h; y++){
        if(selected[x][y]){
          selected[x][y] = false;
          cells[x][y].cell.classList.remove("selected");
        }
      }
    }
    selection_size = 0;
  }

  function update_selection(){
    for(var x = 0; x < w; x++){
      for(var y = 0; y < h; y++){
        if(selected[x][y]){
          cells[x][y].cell.classList.add("selected");
        } else {
          cells[x][y].cell.classList.remove("selected");
        }
      }
    }
  }

  // Temporary selected array used to compute selection move.
  var selected_tmp = new Array(w);
  for(var x = 0; x < w; x++){
    selected_tmp[x] = new Array(h);
  }

  function move_selection(dir){
    // If there is no selected cell, just select the center cell.
    if(selection_size == 0){
      deselecting = false;
      select_cell(Math.floor(w / 2), Math.floor(h / 2));
      return;
    }

    // Save the selection.
    for(var x = 0; x < w; x++){
      for(var y = 0; y < h; y++){
        selected_tmp[x][y] = selected[x][y];
      }
    }

    // Update the selected cells.
    for(var x = 0; x < w; x++){
      for(var y = 0; y < h; y++){
        switch(dir){
          case 0: // east
            selected[x][y] = selected_tmp[(x + w - 1) % w][y];
            break;
          case 1: // south
            selected[x][y] = selected_tmp[x][(y + h - 1) % h];
            break;
          case 2: // west
            selected[x][y] = selected_tmp[(x + 1) % w][y];
            break;
          case 3: // north
            selected[x][y] = selected_tmp[x][(y + 1) % h];
            break;
        }
      }
    }

    // Update the displayed selection.
    update_selection();
  }

  function set_center_mark(x, y, s){
    if(s === ""){
      cells[x][y].center_mark.innerHTML = "";
    } else {
      var v = cells[x][y].center_mark.innerHTML;
      if(v.includes(s)){
        v = v.replace(s, '');
      } else {
        v = (v + s).split('').sort().join('');
      }
      cells[x][y].center_mark.innerHTML = v;
    }
  }

  function set_corner_mark(x, y, s){
    if(s === ""){
      cells[x][y].corner_mark.innerHTML = "";
    } else {
      var v = cells[x][y].corner_mark.innerHTML;
      if(v.includes(s)){
        v = v.replace(s, '');
      } else {
        v = (v + s).split('').sort().join('');
      }
      cells[x][y].corner_mark.innerHTML = v;
    }
  }

  function set_digit(x, y, s){
    var was_empty = cells[x][y].value.innerHTML === "";
    cells[x][y].value.innerHTML = s;
    if(s === ""){
      cells[x][y].center_mark.style.visibility = "visible";
      cells[x][y].corner_mark.style.visibility = "visible";
      if(!was_empty) nb_digits--;
    } else {
      cells[x][y].center_mark.style.visibility = "hidden";
      cells[x][y].corner_mark.style.visibility = "hidden";
      if(was_empty) nb_digits++;
    }
  }

  // Enter digits
  function insert_digit(s){
    for(var x = 0; x < w; x++){
      for(var y = 0; y < h; y++){
        if(selected[x][y] && !given[x][y]){
          if(ctrl_pressed){
            set_center_mark(x, y, s);
          } else if(shift_pressed) {
            set_corner_mark(x, y, s);
          } else {
            set_digit(x, y, s);
          }
        }
      }
    }
  }

  function add_cell_handlers(x, y){
    cells[x][y].cell.addEventListener('mousedown', e => {
      if(!ctrl_pressed){
        clear_selection();
      }
      deselecting = selected[x][y];
      selecting = true;
      select_cell(x, y);
    });

    cells[x][y].cell.addEventListener('mouseup', e => {
      selecting = false;
    });

    cells[x][y].cell.addEventListener('mouseenter', e => {
      if(selecting){
        select_cell(x, y);
      }
    });
  }

  for(var x = 0; x < w; x++){
    for(var y = 0; y < h; y++){
      add_cell_handlers(x, y);
    }
  }

  // Handle keydown event.
  document.addEventListener('keydown', e => {
    e.preventDefault();
    e.stopPropagation();
    if(e.key == "Escape"){
      // Clearing the selection.
      clear_selection();
    } else if(e.code == "Digit1"){
      insert_digit("1");
    } else if(e.code == "Digit2"){
      insert_digit("2");
    } else if(e.code == "Digit3"){
      insert_digit("3");
    } else if(e.code == "Digit4"){
      insert_digit("4");
    } else if(e.code == "Digit5"){
      insert_digit("5");
    } else if(e.code == "Digit6"){
      insert_digit("6");
    } else if(e.code == "Digit7"){
      insert_digit("7");
    } else if(e.code == "Digit8"){
      insert_digit("8");
    } else if(e.code == "Digit9"){
      insert_digit("9");
    } else if(e.key == "Backspace" || e.key == "Delete"){
      // Clear selection.
      insert_digit("");
    } else if(e.key == "Control"){
      // Notify that Control is pressed.
      ctrl_pressed = true;
    } else if(e.key == "Shift"){
      // Notify that Shift is pressed.
      shift_pressed = true;
    } else if(e.key == "ArrowUp"){
      // Initialize or move (single) selection.
      move_selection(3);
    } else if(e.key == "ArrowDown"){
      // Initialize or move (single) selection.
      move_selection(1);
    } else if(e.key == "ArrowLeft"){
      // Initialize or move (single) selection.
      move_selection(2);
    } else if(e.key == "ArrowRight"){
      // Initialize or move (single) selection.
      move_selection(0);
    }
  });

  // Handle keyup event.
  document.addEventListener('keyup', e => {
    e.preventDefault();
    e.stopPropagation();
    if(e.key == "Control"){
      // Notify that Control is not pressed any more.
      ctrl_pressed = false;
    } else if(e.key == "Shift"){
      // Notify that Shift is not pressed any more.
      shift_pressed = false;
    }
  });

  return retval;
}
