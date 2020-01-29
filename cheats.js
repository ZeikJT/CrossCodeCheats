// Written against CrossCode V1.2.0-5
/// START: Cheat settings
var xpcheat = 1; 			     // 0 = off; 1 = on; turns the EXP multiplier cheat on /off
var xpmultiplier = 10; 	         // Sets the EXP multiplier; only used if xpcheat = 1
var xpmingain = 1;			     // Sets the minimum exp gained from an enemy; only used if xpcheat = 1
var creditcheat = 1;		     // 0 = off; 1 = on; turns the credits gained multiplier cheat on /off
var creditmultiplier = 10;	     // Sets the credits gained multiplier; only used if creditcheat = 1
var donotremovecredit = 1;       // 0 = off; 1 = on; turns the credits don't decrease cheat on /off
var donotremovearenacoins = 1;   // 0 = off; 1 = on; turns the arena coins don't decrease cheat on /off
var arenaalwaysbonuses = 1;      // 0 = off; 1 = on; turns the arena aways get all bonuses cheat on /off
var arenaperfectchain = 1;       // 0 = off; 1 = on; turns the arena perfect chain cheat on /off
var arenanodamagepenalty = 1;    // 0 = off; 1 = on; turns the arena no damage penalty cheat on /off
var arenaalwaysplat = 1;         // 0 = off; 1 = on; turns the arena always platinum cheat on /off
var ignorespcheat = 1;  	     // 0 = off; 1 = on; turns the ignore SP cheat on /off
var overheatelim = 1; 		     // 0 = off; 1 = on; turns the Overheat Elimination cheat on /off
var invincible = 1; 		     // 0 = off; 1 = on; turns the invincibility cheat on /off
var cpcheat = 1; 			     // 0 = off; 1 = on; turns the CP does not decrease cheat on /off
var consumableinfinite = 1;      // 0 = off; 1 = on; turns the consumables do not decrease cheat on /off
var consumablenocooldown = 1;    // 0 = off; 1 = on; turns the consumables do not add cooldown cheat on /off
var noknockbackonhit = 1;        // 0 = off; 1 = on; turns the no knockback  on hit cheat on /off
var noactioncancelonhit = 1;     // 0 = off; 1 = on; turns the no action cancel on hit cheat on /off
var tradecheat = 1; 		     // 0 = off; 1 = on; turns the trade does not consume items cheat on /off
var enemydropcheat = 1; 	     // 0 = off; 1 = on; turns the 100% drop rate from enemies cheat on /off
var plantdropcheat = 1;		     // 0 = off; 1 = on; turns the 100% drop rate from plants cheat on /off
var donotremovetrophypoints = 1; // 0 = off; 1 = on; turns the new game plus modifications don't add cost cheat on /off
// For normal EXP gain, with a 5 XP minimum gain per enemy killed, set: xpcheat = 1; xpmultiplier = 1; xpmingain = 5
/// END: Cheat settings
ig.baked = !0;
ig.module("cheats").requires("game.feature.player.player-level", "game.feature.player.player-model", "game.feature.arena.arena", "game.feature.arena.arena-bonus-objectives", "game.feature.player.entities.player", "game.feature.combat.model.combat-params", "game.feature.trade.trade-model", "game.feature.combat.model.enemy-type", "game.feature.model.game-model", "game.feature.combat.entities.enemy", "game.feature.puzzle.entities.item-destruct", "game.feature.new-game.new-game-model").defines(function () {
	// START: Utilities
	function replaceProp(obj, prop, replacer) {
		obj[prop] = replacer(obj[prop]);
	}
	function toggleReplacer(obj, prop, replacer) {
		const original = obj[prop];
		const replacement = replacer(original);
		const replacer = {
			replace() {
				obj[prop] = replacement;
				return replacer; // Enable chaining
			},
			restore() {
				obj[prop] = original;
				return replacer; // Enable chaining
			},
		}
		return replacer;
	}
	function noOp() {}
	// END: Utilities
	// START: Cheats
	replaceProp(sc.PlayerLevelTools, "computeExp", (originalComputeExp) => {
		return (...args) => {
			const exp = originalComputeExp.call(sc.PlayerLevelTools, ...args);
			// If xpcheat is enabled we multiple the exp by xpmultiplier and minimally add xpmingain experience.
			return xpcheat ? Math.max(exp * xpmultiplier, xpmingain) : exp;
		};
	});
	for (const bonus of Object.values(sc.ARENA_BONUS_OBJECTIVE)) {
		replaceProp(bonus, "check", (originalCheck) => {
			return (...args) => {
				// If arenaalwaysbonuses is enabled the checks always returns true.
				return arenaalwaysbonuses || originalCheck.call(bonus, ...args);
			};
		});
	};
	sc.PlayerModel.inject({
		addCredit(amount, ...args) {
			// If creditcheat is enabled we multiply the credits by creditmultiplier.
			this.parent(creditcheat ? amount * creditmultiplier : amount, ...args);
		},
		removeCredit(amount, ...args) {
			// If donotremovecredit is enabled we change the credit deduction to 0.
			this.parent(donotremovecredit ? 0 : amount, ...args);
		},
		addElementLoad(amount, ...args) {
			// If overheatelim is enabled we pass in 0 for the overheat value.
			this.parent(overheatelim ? 0 : amount, ...args);
		},
		learnSkill(skillId, ...args) {
			const element = sc.skilltree.getSkill(skillId).element;
			const previousSkillPoints = this.skillPoints[element];
			this.parent(skillId, ...args);
			if (cpcheat) {
				// If chcheat is enabled reset the cp value to what it was before running learnSkill.
				this.skillPoints[element] = previousSkillPoints;
			}
		},
		useItem(itemIndex, ...args) {
			if (consumableinfinite && itemIndex >= 0 && this.items[itemIndex]) {
				// If consumableinfinite is enabled we set the amount of the current item to be 1 more so that decreasing the value won't have any effect.
				this.items[itemIndex] = this.items[itemIndex] + 1;
			}
			return this.parent(itemIndex, ...args);
		},
		getItemBlockTime(...args) {
			if (consumablenocooldown) {
				// If consumablenocooldown is enabled we return a time of 0 for item block, which means there won't be any block.
				return 0;
			}
			return this.parent(...args);
		},
	});
	sc.Arena.inject({
		removeArenaCoins(amount, ...args) {
			this.parent(amount, ...args);
			if (donotremovearenacoins) {
				// If donotremovearenacoins is enabled we add the coins back.
				this.coins = this.coins + amount;
			}
		},
		onPostUpdate(...args) {
			const runtime = sc.arena.runtime;
			if (arenaperfectchain && runtime && runtime.chainTimer > 0) {
				// If arenaperfectchain is enabled we reset the chain timer to avoid a chain timing out.
				runtime.chainTimer = sc.ARENA_CHAIN_MAX_TIME;
			}
			this.parent(...args);
		},
		onPreDamageModification(data, ...args) {
			let hpChanged = false;
			let actualCurrentHp = 0;
			let playerParams = null;
			if (this.active) {
				if (arenaperfectchain) {
					// If arenaperfectchain is enabled we reset the chain hits counter to keep chains going despite any hits.
					this.runtime.chainHits = sc.ARENA_MAX_CHAIN_HITS;
				}
				playerParams = sc.model.player.params;
				actualCurrentHp = playerParams.currentHp;
				if (invincible && playerParams.currentHp <= data.damage) {
					// If invincible is enabled we set hp to be above the incoming damage.
					playerParams.currentHp = data.damage + 1;
					hpChanged = true;
				}
			}
			this.parent(data, ...args);
			if (hpChanged) {
				// If we changed the hp reset it back to the value it was originally.
				playerParams = actualCurrentHp;
			}
		},
		addScore(type, ...args) {
			if (!arenanodamagepenalty || type !== "DAMAGE_TAKEN") {
				// If arenanodamagepenalty is enabled we don't add damage taken.
				this.parent(type, ...args);
			}
		},
		getMedalForCurrentRound(...args) {
			if (arenaalwaysplat) {
				// If arenaalwaysplat is enabled we return a platinum trophy.
				return sc.ARENA_MEDALS_TROPHIES.PLATIN;
			}
			return this.parent(...args);
		},
	});
	const getSpReplacer = toggleReplacer(sc.CombatParams.prototype, "getSp", () => function() {return this.maxSp});
	const cancelActionReplacer = toggleReplacer(ig.ENTITY.Player.prototype, "cancelAction", () => noOp);
	ig.ENTITY.Player.inject({
		startCharge(...args) {
			// If ignorespcheat is enabled we replace the getSp function to return the max sp instead of current sp.
			ignorespcheat && getSpReplacer.replace();
			const returnValue = this.parent(...args);
			ignorespcheat && getSpReplacer.restore();
			return returnValue;
		},
		doDamageMovement(...args) {
			if (noknockbackonhit && this.dying === sc.DYING_STATE.ALIVE) {
				// If noknockbackonhit is enabled we do nothing.
				return 0;
			}
			return this.parent(...args);
		},
		onDamage(...args) {
			// If noactioncancelonhit is enabled we replace the cancelAction function with one that does nothing.
			noactioncancelonhit && cancelActionReplacer.replace();
			const returnValue = this.parent(...args);
			noactioncancelonhit && cancelActionReplacer.restore();
			return returnValue;
		},
	});
	sc.CombatParams.inject({
		reduceHp(amount, ...args) {
			if (invincible && this.combatant.party === sc.COMBATANT_PARTY.PLAYER && this.currentHp <= amount) {
				// If invincible is enabled and the player health would fall to 0 or below we set health to be higher than damage.
				this.currentHp = amount + 1;
			}
			this.parent(amount, ...args);
		},
	});
	const removeItemReplacer = toggleReplacer(sc.PlayerModel.prototype, "removeItem", () => noOp);
	sc.TradeModel.inject({
		doTrade(...args) {
			// If tradecheat is enabled we replace the removeItem function with one that does nothing.
			tradecheat && removeItemReplacer.replace();
			const returnValue = this.parent(...args);
			tradecheat && removeItemReplacer.restore();
			return returnValue;
		},
	});
	const getCombatRankByLabelReplacer = toggleReplacer(sc.GameModel.prototype, "getCombatRankByLabel", () => () => 0);
	const mathRandomReplacer = toggleReplacer(Math, "random", () => () => 0);
	sc.EnemyType.inject({
		resolveItemDrops(enemy, ...args) {
			enemydropcheat && getCombatRankByLabelReplacer.replace() && mathRandomReplacer.replace() && (enemy.boosterState = sc.ENEMY_BOOSTER_STATE.BOOSTED);
			this.parent(enemy, ...args);
			enemydropcheat && getCombatRankByLabelReplacer.restore() && mathRandomReplacer.restore();
		},
	});
	const getModifierReplacer = toggleReplacer(sc.CombatParams.prototype, "getModifier", () => () => 1000);
	ig.ENTITY.ItemDestruct.inject({
		dropItem(...args) {
			plantdropcheat && mathRandomReplacer.replace() && getModifierReplacer.replace();
			this.parent(...args);
			plantdropcheat && mathRandomReplacer.restore() && getModifierReplacer.restore();
		},
	});
	sc.NewGamePlusModel.inject({
		getCost(...args) {
			if (donotremovetrophypoints) {
				return 0;
			}
			return this.parent(...args);
		},
	});
	// END: Cheats
});
ig.baked = !0;
ig.module("cheats-gui").requires("game.feature.gui.screen.title-screen", "game.feature.gui.screen.pause-screen", "game.feature.menu.gui.base-menu", "game.feature.menu.menu-model", "impact.base.lang", "impact.feature.gui.gui", "game.feature.interact.button-group", "game.feature.menu.gui.menu-misc", "game.feature.menu.gui.options.options-misc", "game.feature.gui.base.text", "game.feature.gui.base.button", "impact.feature.interact.press-repeater", "game.feature.gui.base.numbers", "game.feature.font.font-system").defines(function () {
	// START: Lang Extension
	// If this code is changed into a real mod/extension this can be moved into a separate lang JSON.
	const LANG_EXTENSION = {
		"sc": {
			"cheats": {
				"title": "Cheats",
				"name": {
					"arenaalwaysbonuses": "Arena Always Bonuses",
					"arenaalwaysplat": "Arena Always Platinum",
					"arenanodamagepenalty": "Arena No Damage Penalty",
					"arenaperfectchain": "Arena Perfect Chain",
					"cpcheat": "Do Not Remove CP",
					"consumableinfinite": "Consumable Infinite",
					"consumablenocooldown": "Consumable No Cooldown",
					"creditcheat": "Credit Cheats",
					"creditmultiplier": "Credit Multiplier",
					"donotremovearenacoins": "Do Not Remove Arena Coins",
					"donotremovecredit": "Do Not Remove Credit",
					"donotremovetrophypoints": "NG+ Mods Total Cost Zero",
					"enemydropcheat": "Enemy Drop",
					"ignorespcheat": "Ignore SP",
					"invincible": "Invincible",
					"noactioncancelonhit": "No Action Cancel On Hit",
					"noknockbackonhit": "No Knockback On Hit",
					"overheatelim": "Overheat Elimination",
					"plantdropcheat": "Plant Drop",
					"tradecheat": "Do Not Remove Items On Trade",
					"xpcheat": "XP Cheats",
					"xpmingain": "XP Min Gain",
					"xpmultiplier": "XP Multiplier"
				}
			}
		}
	};
	ig.Lang.inject({
		onload(...args) {
			this.parent(...args);
			function setProperties(from, to) {
				for (const [key, value] of Object.entries(from)) {
					if (typeof value === "object") {
						setProperties(value, to[key] = to[key] || {});
					} else {
						to[key] = value;
					}
				}
			}
			setProperties(LANG_EXTENSION, this.labels);
		},
	})
	//*/
	// END: Lang Extension
	function isNewGamePlus() {
		// This is the ONLY method in the game that checks for new game plus and returns a boolean...
		return sc.TitleScreenButtonGui.prototype.checkClearSaveFiles();
	}
	// START: Cheats Menu
	const CHEAT_CONFIG = [
		["xpcheat", {type: "CHECKBOX"}],
		["xpmultiplier", {type: "SLIDER", min: 0, max: 100, requires: ["xpcheat"]}],
		["xpmingain", {type: "SLIDER", min: 0, max: 1000, requires: ["xpcheat"]}],
		["creditcheat", {type: "CHECKBOX"}],
		["creditmultiplier", {type: "SLIDER", min: 0, max: 100, requires: ["creditcheat"]}],
		["donotremovecredit", {type: "CHECKBOX"}],
		["donotremovearenacoins", {type: "CHECKBOX"}],
		["arenaalwaysbonuses", {type: "CHECKBOX"}],
		["arenaperfectchain", {type: "CHECKBOX"}],
		["arenanodamagepenalty", {type: "CHECKBOX"}],
		["arenaalwaysplat", {type: "CHECKBOX"}],
		["ignorespcheat", {type: "CHECKBOX"}],
		["overheatelim", {type: "CHECKBOX"}],
		["invincible", {type: "CHECKBOX"}],
		["cpcheat", {type: "CHECKBOX"}],
		["consumableinfinite", {type: "CHECKBOX"}],
		["consumablenocooldown", {type: "CHECKBOX"}],
		["noknockbackonhit", {type: "CHECKBOX"}],
		["noactioncancelonhit", {type: "CHECKBOX"}],
		["tradecheat", {type: "CHECKBOX"}],
		["enemydropcheat", {type: "CHECKBOX"}],
		["plantdropcheat", {type: "CHECKBOX"}],
		["donotremovetrophypoints", {type: "CHECKBOX", preconditions: ["NEW_GAME_PLUS"]}],
	];
	const CHEAT_CONFIG_MAP = new Map(CHEAT_CONFIG);
	const CHEAT_REQUIRES_MAP = CHEAT_CONFIG.reduce((map, [cheat, {requires}]) => {
		if (requires) {
			for (const required of requires) {
				const requiredDeps = map.get(required) || [];
				requiredDeps.push(cheat);
				map.set(required, requiredDeps);
			}
		}
		return map;
	}, new Map);
	function getCheatValue(cheat) {
		return window[cheat];
	}
	function setCheatValue(cheat, value) {
		return window[cheat] = value;
	}
	const Label = sc.TextGui.extend({
		disabledText: "",
		enabled: true,
		enabledText: "",
		init(text) {
			this.parent(text, {
				speed: ig.TextBlock.SPEED.IMMEDIATE,
			});
			this.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_TOP);
			this.disabledText = `\\c[${sc.FONT_COLORS.GREY}]${this.text}`;
			this.enabledText = this.text;
		},
		setEnabled(enabled) {
			this.enabled = enabled;
			this.setText(enabled ? this.enabledText : this.disabledText);
		},
	});
	const NumberSlider = sc.OptionFocusSlider.extend({
		enabled: true,
		thumbNum: null,
		init(changeCallback, value, min, max, buttonGroup) {
			this.parent((newValue) => {
				this.updateNumberDisplay(newValue);
				changeCallback(newValue);
			}, /* snap= */ true, /* fill= */ true, buttonGroup);

			this.setPreferredThumbSize((String(max).length + 1) * sc.NUMBER_SIZE.NORMAL.width, 21);
			this.setMinMaxValue(min, max);
			this.setValue(value);

			// The number preview of what value the slider is on.
			this.thumbNum = new sc.NumberGui(max);
			this.updateNumberDisplay(value);
			this.thumbNum.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_CENTER);
			this.thumb.addChildGui(this.thumbNum);
		},
		setSize(...args) {
			this.parent(...args);
			this.updateNumberDisplay();
		},
		updateNumberDisplay(newValue = this.thumbNum.getNumber()) {
			// Update the value shown in the thumb.
			this.thumbNum.setNumber(newValue, true);
			// Change the size of the thumbNum to keep it centered.
			this.thumbNum.hook.size.x = String(newValue).length * sc.NUMBER_SIZE.NORMAL.width;
		},
		setEnabled(enabled) {
			this.enabled = enabled;
			this.thumbNum.setColor(enabled ? sc.GUI_NUMBER_COLOR.WHITE : sc.GUI_NUMBER_COLOR.GREY);
		},
		onMouseInteract(allowMouseOver, allowChange) {
			this.parent(allowMouseOver, allowChange && this.enabled);
		},
		onDrag(...args) {
			if (!this.enabled) {
				return;
			}
			this.parent(...args);
		},
		onKeyboardInput(key) {
			if (!this.enabled) {
				return;
			}
			// The value we update by varies based on whether we"re holding certain buttons for A11Y.
			const changeValue = sc.control.dashHold() ? 100 : sc.control.quickmenu() ? 10 : 1;
			switch (key) {
				case "right":
				case "left": {
					const direction = key === "left" ? -1 : 1;
					const newValue = this.getValue() + (changeValue * direction);
					const clamped = Math.max(this.slider.minValue, Math.min(this.slider.maxValue, newValue));
					this.setValue(clamped);
					this.changeCallback(clamped);
					break;
				}
			}
		},
	});
	const scrollSpeed = 0.05;
	const mouseScrollAmount = 20;
	sc.CheatsMenu = sc.BaseMenu.extend({
		buttonGroup: null,
		cheats: null,
		contents: null,
		labels: null,
		list: null,
		newgameplus: false,
		repeater: null,
		init() {
			this.parent();
			this.newgameplus = isNewGamePlus();
			this.cheats = new Map;
			this.labels = new Map;

			this.hook.size.x = ig.system.width;
			this.hook.size.y = ig.system.height;
			this.buttonGroup = new sc.ButtonGroup; // Controls focus of controls and keyboard inputs.
			this.contents = new ig.GuiElementBase;
			this.repeater = new ig.PressRepeater; // Takes care of debouncing the inputs so we don't move the sliders uncontrollably quickly.

			// Create the container that has a scrollbar.
			this.list = new sc.ScrollPane(sc.ScrollType.Y_ONLY);
			this.list.showTopBar = false;
			this.list.showBottomBar = false;
			this.list.setSize(400, 240);
			this.list.setPos(0, 0);
			this.list.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_CENTER);
			// Setup animations so that the list slides in like the other lists do (ex: Save, Options, etc).
			this.list.hook.transitions = {
				DEFAULT: {
					state: {},
					time: 0.2,
					timeFunction: KEY_SPLINES.LINEAR,
				},
				HIDDEN: {
					state: {
						alpha: 0,
						offsetX: 218,
					},
					time: 0.2,
					timeFunction: KEY_SPLINES.LINEAR,
				}
			};
			// List starts hidden.
			this.list.doStateTransition("HIDDEN", true);

			// Add press callback so we can react when checkboxes are changed.
			this.buttonGroup.addPressCallback((control) => {
				if (control instanceof sc.CheckboxGui) {
					this.setCheatValue(control.data.cheat, control.pressed ? 1 : 0);
				}
			});

			// Iterate through the cheats and create the UI for each.
			for (const [row, [cheat, data]] of CHEAT_CONFIG.entries()) {
				const rowYPos = row * 25;
				const cheatValue = getCheatValue(cheat);

				// Each cheat has a corresponding label saying what it is.
				const label = new Label(ig.lang.get(`sc.cheats.name.${cheat}`));
				label.setPos(0, rowYPos);
				this.contents.addChildGui(label);
				this.labels.set(cheat, label);

				let control;
				switch (data.type) {
					case "CHECKBOX": {
						control = new sc.CheckboxGui(cheatValue, 30);
						control.data = {cheat};
						break;
					}
					case "SLIDER": {
						control = new NumberSlider((newValue) => {
							this.setCheatValue(cheat, newValue);
						}, cheatValue, data.min, data.max, this.buttonGroup);
						control.setSize(180, 21, 9);
						break;
					}
				}
				control.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_TOP);
				control.setPos(200, rowYPos);
				this.contents.addChildGui(control);
				this.buttonGroup.addFocusGui(control, 0, row);
				this.cheats.set(cheat, control);
				if (data.requires) {
					this.updateCheatControls(cheat);
				}
			}
			const cheatChildren = this.contents.hook.children;
			const lastCheatChild = cheatChildren[cheatChildren.length - 1];
			// Set the height of the contents to encompass all the children.
			this.contents.hook.size.y = lastCheatChild.pos.y + lastCheatChild.size.y;
			this.list.setContent(this.contents);
			this.list.box.doScrollTransition(0, 0, 0);
			this.addChildGui(this.list);
			this.doStateTransition("DEFAULT");
		},
		setCheatValue(cheat, newValue) {
			setCheatValue(cheat, newValue);
			if (CHEAT_REQUIRES_MAP.has(cheat)) {
				for (const dependentCheat of CHEAT_REQUIRES_MAP.get(cheat)) {
					this.updateCheatControls(dependentCheat);
				}
			}
		},
		updateCheatControls(cheat) {
			const enabled = CHEAT_CONFIG_MAP.get(cheat).requires.every(getCheatValue);
			this.labels.get(cheat).setEnabled(enabled);
			this.cheats.get(cheat).setEnabled(enabled);
		},
		update() {
			this.parent();
			if (!ig.interact.isBlocked()) {
				// Handle scroll wheel.
				if (sc.control.menuScrollUp()) {
					this.list.scrollY(-mouseScrollAmount, 0, scrollSpeed);
				} else if (sc.control.menuScrollDown()) {
					this.list.scrollY(mouseScrollAmount, 0, scrollSpeed);
				}
				const control = this.buttonGroup.getCurrentElement();
				const repeaterValue = this.getRepeaterValue();
				// Handle keyboard up and down keys.
				if (repeaterValue === "up" || repeaterValue === "down") {
					const controlTopY = control.hook.pos.y;
					const controlBottomY = controlTopY + control.hook.size.y;
					const scrollTopY = this.list.getScrollY();
					const scrollBottomY = scrollTopY + this.list.hook.size.y;
					if (controlTopY < scrollTopY) {
						// If the selected control is beyond the top scroll up to it.
						this.list.setScrollY(controlTopY, 0, scrollSpeed);
					} else if (controlBottomY > scrollBottomY) {
						// If the selected control is beyond the bottom scroll down to it.
						this.list.setScrollY(controlBottomY - this.list.hook.size.y + 2 /* why? */, 0, scrollSpeed);
					}
				}
				// Handle left and right for sliders.
				if (control instanceof NumberSlider) {
					control.onKeyboardInput(repeaterValue);
				}
			}
		},
		getRepeaterValue: function () {
			if (sc.control.rightDown()) {
				this.repeater.setDown("right");
			} else if (sc.control.leftDown()) {
				this.repeater.setDown("left");
			} else if (sc.control.downDown()) {
				this.repeater.setDown("down");
			} else if (sc.control.upDown()) {
				this.repeater.setDown("up");
			}
			return this.repeater.getPressed();
		},
		addObservers() {
			sc.Model.addObserver(sc.menu, this);
		},
		removeObservers() {
			sc.Model.removeObserver(sc.menu, this);
		},
		showMenu() {
			this.addObservers();
			sc.menu.pushBackCallback(this.onBackButtonPress.bind(this)); // Register back button handling.
			sc.menu.moveLeaSprite(0, 0, sc.MENU_LEA_STATE.HIDDEN); // No idea what this is.
			sc.menu.buttonInteract.pushButtonGroup(this.buttonGroup); // Make our button group active.
			ig.interact.setBlockDelay(0.2); // Don't let the user interact while the menu is animating into place.
			this.list.doStateTransition("DEFAULT"); // Animation the list.
		},
		hideMenu() {
			this.removeObservers();
			sc.menu.moveLeaSprite(0, 0, sc.MENU_LEA_STATE.LARGE); // No idea what this is.
			this.exitMenu();
		},
		exitMenu() {
			sc.menu.buttonInteract.removeButtonGroup(this.buttonGroup); // Make our button group inactive.
			sc.menu.popBackCallback(); // Unregister the back button handling.
			this.list.doStateTransition("HIDDEN"); // Animation the list.
		},
		onBackButtonPress() {
			// Pop our menu to go back up to the menu that created ours.
			sc.menu.popMenu();
		},
		modelChanged() {},
	});

	// Add cheats as a new submenu item.
	sc.MENU_SUBMENU.CHEATS = Object.keys(sc.MENU_SUBMENU).length;
	// Define the cheats name and what class it instantiates.
	sc.SUB_MENU_INFO[sc.MENU_SUBMENU.CHEATS] = {
		Clazz: sc.CheatsMenu,
		name: "cheats",
	};
	// END: Cheats Menu
	// START: Cheats GUI
	sc.MenuModel.inject({
		getMenuAsName(menuId) {
			if (menuId === sc.MENU_SUBMENU.CHEATS) {
				return ig.lang.get("sc.cheats.title");
			}
			return this.parent.apply(this, arguments);
		},
	});
	sc.TitleScreenButtonGui.inject({
		cheatsButton: null,
		init() {
			this.parent();
			this.cheatsButton = new sc.ButtonGui(ig.lang.get("sc.cheats.title"), this.gameCodeButton.hook.size.x);
			this.cheatsButton.setAlign(this.gameCodeButton.hook.align.x, this.gameCodeButton.hook.align.y);
			this.cheatsButton.setPos(this.gameCodeButton.hook.pos.x, this.gameCodeButton.hook.pos.y + 28);
			this.cheatsButton.onButtonPress = () => {
				// What menu should be entered when clicked.
				sc.menu.setDirectMode(true, sc.MENU_SUBMENU.CHEATS);
				sc.model.enterMenu(true);
			};
			this.cheatsButton.hook.transitions = this.gameCodeButton.hook.transitions;
			this.cheatsButton.doStateTransition("HIDDEN", true);
			this.buttonGroup.insertFocusGui(this.cheatsButton, 1, 0);
			this.insertChildGui(this.cheatsButton);
		},
		show() {
			this.parent();
			this.cheatsButton.doStateTransition("DEFAULT");
		},
		hide(a) {
			this.parent.apply(this, arguments);
			this.cheatsButton.doStateTransition("HIDDEN", a);
		},
	});
	sc.PauseScreenGui.inject({
		cheatsButton: null,
		init() {
			this.parent();
			// Create our new Cheats menu button.
			this.cheatsButton = new sc.ButtonGui(ig.lang.get("sc.cheats.title"), sc.BUTTON_DEFAULT_WIDTH);
			this.cheatsButton.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_BOTTOM);
			this.cheatsButton.onButtonPress = () => {
				// What menu should be entered when clicked.
				sc.menu.setDirectMode(true, sc.MENU_SUBMENU.CHEATS);
				sc.model.enterMenu(true);
			};
			this.insertChildGui(this.cheatsButton);
		},
		updateButtons() {
			this.removeChildGui(this.cheatsButton);
			this.parent();
			this.addChildGui(this.cheatsButton);

			const firstButtonHook = this.buttonGroup.elements[0][0].hook;
			// Position our new Cheats button above the current ones.
			this.cheatsButton.setPos(firstButtonHook.pos.x, firstButtonHook.pos.y + firstButtonHook.size.y + 16);
			// Set it to be first in keyboard order, bump the others down.
			this.buttonGroup.insertFocusGui(this.cheatsButton, 0, 0);
		},
	});
	// END: Cheats GUI
});