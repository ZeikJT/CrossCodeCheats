// Written against CrossCode V1.2.0-5
(() => {
const CHEAT_CONFIG = [
	["xpcheat",                 {defaultValue: true, type: "CHECKBOX"}],
	["xpmultiplier",            {defaultValue: 10,   type: "SLIDER", min: 0, max: 100,  requires: ["xpcheat"]}],
	["xpmingain",               {defaultValue: 1,    type: "SLIDER", min: 0, max: 1000, requires: ["xpcheat"]}],
	["creditcheat",             {defaultValue: true, type: "CHECKBOX"}],
	["creditmultiplier",        {defaultValue: 10,   type: "SLIDER", min: 0, max: 100,  requires: ["creditcheat"]}],
	["donotremovecredit",       {defaultValue: true, type: "CHECKBOX"}],
	["donotremovearenacoins",   {defaultValue: true, type: "CHECKBOX"}],
	["arenaalwaysbonuses",      {defaultValue: true, type: "CHECKBOX"}],
	["arenaperfectchain",       {defaultValue: true, type: "CHECKBOX"}],
	["arenanodamagepenalty",    {defaultValue: true, type: "CHECKBOX"}],
	["arenaalwaysplat",         {defaultValue: true, type: "CHECKBOX"}],
	["ignorespcheat",           {defaultValue: true, type: "CHECKBOX"}],
	["overheatelim",            {defaultValue: true, type: "CHECKBOX"}],
	["invincible",              {defaultValue: true, type: "CHECKBOX"}],
	["cpcheat",                 {defaultValue: true, type: "CHECKBOX"}],
	["consumableinfinite",      {defaultValue: true, type: "CHECKBOX"}],
	["consumablenocooldown",    {defaultValue: true, type: "CHECKBOX"}],
	["noknockbackonhit",        {defaultValue: true, type: "CHECKBOX"}],
	["noactioncancelonhit",     {defaultValue: true, type: "CHECKBOX"}],
	["tradecheat",              {defaultValue: true, type: "CHECKBOX"}],
	["enemydropcheat",          {defaultValue: true, type: "CHECKBOX"}],
	["plantdropcheat",          {defaultValue: true, type: "CHECKBOX"}],
	["donotremovetrophypoints", {defaultValue: true, type: "CHECKBOX", preconditions: ["NEW_GAME_PLUS"]}],
	["jumphigher",              {defaultValue: true, type: "CHECKBOX"}],
	["jumphighermodifier",      {defaultValue: 5,    type: "SLIDER", min: 1, max: 10,  requires: ["jumphigher"]}],
	["jumpfurther",             {defaultValue: 10,   type: "SLIDER", min: 10, max: 40,requires: ["jumphigher"]}],
	["skipintro",               {defaultValue: true, type: "CHECKBOX"}],
	["unlimiteddashes",         {defaultValue: true, type: "CHECKBOX"}],
	["runspeed",                {defaultValue: true, type: "CHECKBOX"}],
	["runspeedmultiplier",      {defaultValue: 10,   type: "SLIDER", min: 1, max: 100,requires: ["runspeed"]}],
	["maxresistance",           {defaultValue: true, type: "CHECKBOX"}],
	["instantaim",              {defaultValue: true, type: "CHECKBOX"}],
	["dontresetpuzzles",        {defaultValue: true, type: "CHECKBOX"}],
];

const CHEAT_CONFIG_MAP = new Map(CHEAT_CONFIG);
const cheatValues = new Map(CHEAT_CONFIG.map(([cheat, {defaultValue}]) => {
	window[cheat] = defaultValue; // For non CCLoader implementations.
	return [cheat, defaultValue];
}));
// Adaptors for getters and setters to ensure we can swap out the underlying structures easily.
function getCheatValue(cheat) {
	return cheatValues.get(cheat);
}
function getCheatsObject() {
	return Array.from(cheatValues).reduce((obj, [cheat, value]) => {
		obj[cheat] = value;
		return obj;
	}, Object.create(null));
}
function setCheatValue(cheat, value) {
	window[cheat] = value; // For non CCLoader implementations.
	return cheatValues.set(cheat, value);
}
ig.baked = !0;
ig.module("cheats").requires("game.feature.player.player-level", "game.feature.player.player-model", "game.feature.arena.arena", "game.feature.arena.arena-bonus-objectives", "game.feature.player.entities.player", "game.feature.combat.model.combat-params", "game.feature.trade.trade-model", "game.feature.combat.model.enemy-type", "game.feature.model.game-model", "game.feature.combat.entities.enemy", "game.feature.puzzle.entities.item-destruct", "game.feature.new-game.new-game-model", "game.feature.player.entities.crosshair","game.feature.puzzle.entities.bounce-switch").defines(function () {
	// START: Utilities
	function replaceProp(obj, prop, replaceFunc) {
		obj[prop] = replaceFunc(obj[prop]);
	}
	function toggleReplacer(obj, prop, replaceFunc) {
		const original = obj[prop];
		const replacement = replaceFunc(original);
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
			return getCheatValue("xpcheat") ? Math.max(exp * getCheatValue("xpmultiplier"), getCheatValue("xpmingain")) : exp;
		};
	});
	replaceProp(sc.PlayerLevelTools, "computeBaseParams", (originalComputeBaseParams) => {
		return (a, ...args) => {
			var ret = originalComputeBaseParams.call(sc.PlayerLevelTools, a, ...args);

			if(getCheatValue("maxresistance")) {
				a.elemFactor[0] = 2;
				a.elemFactor[1] = 2;
				a.elemFactor[2] = 2;
				a.elemFactor[3] = 2;
				//a.defense = 9e150;
			}

			return ret;
		};
	});

	replaceProp(sc.PlayerLevelTools, "updateEquipStats", (originalUpdateEquipStats) => {
		return (a, b, c) => {
			var ret = originalUpdateEquipStats.call(sc.PlayerLevelTools, a, b, c);

			if(getCheatValue("maxresistance")) {
				b.elemFactor[0] = 2;
				b.elemFactor[1] = 2;
				b.elemFactor[2] = 2;
				b.elemFactor[3] = 2;
				//b.defense = 9e150;
			}

			return ret;
		};
	});

	for (const bonus of Object.values(sc.ARENA_BONUS_OBJECTIVE)) {
		replaceProp(bonus, "check", (originalCheck) => {
			return (...args) => {
				// If arenaalwaysbonuses is enabled the checks always returns true.
				return getCheatValue("arenaalwaysbonuses") || originalCheck.call(bonus, ...args);
			};
		});
	};
	sc.PlayerModel.inject({
		addCredit(amount, ...args) {
			// If creditcheat is enabled we multiply the credits by creditmultiplier.
			this.parent(getCheatValue("creditcheat") ? amount * getCheatValue("creditmultiplier") : amount, ...args);
		},
		removeCredit(amount, ...args) {
			// If donotremovecredit is enabled we change the credit deduction to 0.
			this.parent(getCheatValue("donotremovecredit") ? 0 : amount, ...args);
		},
		addElementLoad(amount, ...args) {
			// If overheatelim is enabled we pass in 0 for the overheat value.
			this.parent(getCheatValue("overheatelim") ? 0 : amount, ...args);
		},
		learnSkill(skillId, ...args) {
			const element = sc.skilltree.getSkill(skillId).element;
			const previousSkillPoints = this.skillPoints[element];
			this.parent(skillId, ...args);
			if (getCheatValue("cpcheat")) {
				// If chcheat is enabled reset the cp value to what it was before running learnSkill.
				this.skillPoints[element] = previousSkillPoints;
			}
		},
		useItem(itemIndex, ...args) {
			if (getCheatValue("consumableinfinite") && itemIndex >= 0 && this.items[itemIndex]) {
				// If consumableinfinite is enabled we set the amount of the current item to be 1 more so that decreasing the value won't have any effect.
				this.items[itemIndex] = this.items[itemIndex] + 1;
			}
			return this.parent(itemIndex, ...args);
		},
		getItemBlockTime(...args) {
			if (getCheatValue("consumablenocooldown")) {
				// If consumablenocooldown is enabled we return a time of 0 for item block, which means there won't be any block.
				return 0;
			}
			return this.parent(...args);
		},
	});
	ig.ENTITY.Crosshair.inject({
		init(...args) {
			var ret = this.parent(...args);
			if(getCheatValue("instantaim")) {
				this.speedFactor = 99;
			}
			return ret;
		},
		setSpeedFactor(...args) {
			var ret = this.parent(...args);
			if(getCheatValue("instantaim")) {
				this.speedFactor = 99;
			}
			return ret;
		},
	});
	sc.Arena.inject({
		removeArenaCoins(amount, ...args) {
			this.parent(amount, ...args);
			if (getCheatValue("donotremovearenacoins")) {
				// If donotremovearenacoins is enabled we add the coins back.
				this.coins = this.coins + amount;
			}
		},
		onPostUpdate(...args) {
			const runtime = sc.arena.runtime;
			if (getCheatValue("arenaperfectchain") && runtime && runtime.chainTimer > 0) {
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
				if (getCheatValue("arenaperfectchain")) {
					// If arenaperfectchain is enabled we reset the chain hits counter to keep chains going despite any hits.
					this.runtime.chainHits = sc.ARENA_MAX_CHAIN_HITS;
				}
				playerParams = sc.model.player.params;
				actualCurrentHp = playerParams.currentHp;
				if (invincible /*&& playerParams.currentHp <= data.damage*/) {
					// If invincible is enabled we set hp to be above the incoming damage.
					playerParams.currentHp += data.damage;
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
			if (!getCheatValue("arenanodamagepenalty") || type !== "DAMAGE_TAKEN") {
				// If arenanodamagepenalty is enabled we don't add damage taken.
				this.parent(type, ...args);
			}
		},
		getMedalForCurrentRound(...args) {
			if (getCheatValue("arenaalwaysplat")) {
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
			getCheatValue("ignorespcheat") && getSpReplacer.replace();
			const returnValue = this.parent(...args);
			getCheatValue("ignorespcheat") && getSpReplacer.restore();
			return returnValue;
		},
		doDamageMovement(...args) {
			if (getCheatValue("noknockbackonhit") && this.dying === sc.DYING_STATE.ALIVE) {
				// If noknockbackonhit is enabled we do nothing.
				return 0;
			}
			return this.parent(...args);
		},
		onDamage(...args) {
			// If noactioncancelonhit is enabled we replace the cancelAction function with one that does nothing.
			getCheatValue("noactioncancelonhit") && cancelActionReplacer.replace();
			const returnValue = this.parent(...args);
			getCheatValue("noactioncancelonhit") && cancelActionReplacer.restore();
			return returnValue;
		},
		startDash(...args) {
			var cheat = getCheatValue("unlimiteddashes");

			if(cheat)
			{
				this.dashCount = 0;
			}

			var result = this.parent(...args);

			if(cheat)
			{
				this.dashCount = 0;
			}

			return result;
		},
		updatePlayerMovement(a, b) {
			if(getCheatValue("runspeed"))
			{
				b.relativeVel *= getCheatValue("runspeedmultiplier") / 10;
			}

			return this.parent(a, b);
		},
	});
	sc.CombatParams.inject({
		reduceHp(amount, ...args) {
			if (getCheatValue("invincible") && this.combatant.party === sc.COMBATANT_PARTY.PLAYER && this.currentHp <= amount) {
				// If invincible is enabled and the player health would fall to 0 or below we set health to be higher than damage.
				this.currentHp += amount;
			}
			this.parent(amount, ...args);
		},
	});
	const removeItemReplacer = toggleReplacer(sc.PlayerModel.prototype, "removeItem", () => noOp);
	sc.TradeModel.inject({
		doTrade(...args) {
			// If tradecheat is enabled we replace the removeItem function with one that does nothing.
			getCheatValue("tradecheat") && removeItemReplacer.replace();
			const returnValue = this.parent(...args);
			getCheatValue("tradecheat") && removeItemReplacer.restore();
			return returnValue;
		},
	});
	const getCombatRankByLabelReplacer = toggleReplacer(sc.GameModel.prototype, "getCombatRankByLabel", () => () => 0);
	const mathRandomReplacer = toggleReplacer(Math, "random", () => () => 0);
	sc.EnemyType.inject({
		resolveItemDrops(enemy, ...args) {
			getCheatValue("enemydropcheat") && getCombatRankByLabelReplacer.replace() && mathRandomReplacer.replace() && (enemy.boosterState = sc.ENEMY_BOOSTER_STATE.BOOSTED);
			this.parent(enemy, ...args);
			getCheatValue("enemydropcheat") && getCombatRankByLabelReplacer.restore() && mathRandomReplacer.restore();
		},
	});
	const getModifierReplacer = toggleReplacer(sc.CombatParams.prototype, "getModifier", () => () => 1000);
	ig.ENTITY.ItemDestruct.inject({
		dropItem(...args) {
			getCheatValue("plantdropcheat") && mathRandomReplacer.replace() && getModifierReplacer.replace();
			this.parent(...args);
			getCheatValue("plantdropcheat") && mathRandomReplacer.restore() && getModifierReplacer.restore();
		},
	});
	sc.NewGamePlusModel.inject({
		getCost(...args) {
			if (getCheatValue("donotremovetrophypoints")) {
				return 0;
			}
			return this.parent(...args);
		},
	});
	var a = Vec2.create(), d = {};
	var cheat_perform_jump = false;
	ig.ActorEntity.inject({
		_checkForUpwardJump() {
			if (!this.isPlayer || !getCheatValue("jumphigher")) {
				return this.parent();
			}

			var b = this.coll;
			b = ig.getDirectionIndex(b.accelDir.x, b.accelDir.y, 8);
			b = ig.getDirectionVel(b, 8, a);
			e = ig.game.physics.initTraceResult(d);
			if (!ig.game.traceEntity(e, this, b.x, b.y, 0, 0, 0, ig.COLLTYPE.IGNORE))
				return false;
			e = ig.game.physics.initTraceResult(d);

			var ret = !ig.game.traceEntity(e, this, b.x, b.y, 0, 0, 19 * getCheatValue("jumphighermodifier"));

			if(ret) {
				cheat_perform_jump = this.secondJumpCheck;
			}

			return ret;
		},
        doJump(a,...args) {
            if ((!this.isPlayer) ||
				(!getCheatValue("jumphigher"))) {
				return this.parent(a,...args);
            }

            if(!cheat_perform_jump)
			{
				a *= (getCheatValue("jumpfurther") / 10);
				return this.parent(a,...args);
			}
            var old_value = getCheatValue("jumphighermodifier");
            var base_jump_height = 19;

            // adjust the height so Lea lands "kind of" exactly on top of the surface, else we will jump too high
			var count = 0;
			setCheatValue("jumphighermodifier", count);

            while((!this._checkForUpwardJump()) && (count < old_value))
			{
				++count;
                a += (base_jump_height * 2);
				setCheatValue("jumphighermodifier", count);
            }

            setCheatValue("jumphighermodifier", old_value);

			cheat_perform_jump = false;
            return this.parent(a,...args);
        },
		doFloatJump(...args) {
			cheat_perform_jump = false;
		    return this.parent(...args);
		},
	});
	sc.TitleScreenGui.inject({
		modelChanged(c, d) {
			if (getCheatValue("skipintro")) {
				if (c == sc.model && d == sc.GAME_MODEL_MSG.STATE_CHANGED) {
					var e = c.isTitle() ? 'DEFAULT' : 'HIDDEN';
					if (this.hook.currentStateName != e) {
						if (e == 'DEFAULT') {
							if (!window.IG_GAME_DEBUG) {
								if (!this.isPostInit) {
									this.isPostInit = true;
									this.postInit();
								}
								this.buttons.hide(true);
								ig.bgm.clear('MEDIUM');
								this._introDone();
								this.doStateTransition(e, true);
								return;
							}
						}
					}
				}
			}
			return this.parent(c, d);
		}
	});
	sc.CombatParams.inject({
		reduceHp(amount, ...args) {
			if (getCheatValue("invincible") && this.combatant.party === sc.COMBATANT_PARTY.PLAYER && this.currentHp <= amount) {
				// If invincible is enabled and the player health would fall to 0 or below we set health to be higher than damage.
				this.currentHp += amount;
			}
			this.parent(amount, ...args);
		},
	});
	sc.BounceSwitchGroups.inject({
		resetGroup(...args) {
			if(getCheatValue("dontresetpuzzles"))
			{
				return null;
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
					"xpmultiplier": "XP Multiplier",
					"jumphigher": "Jump Higher",
					"jumphighermodifier": "Jump Height Multiplier",
					"jumpfurther": "Jump Further Multiplier (10 = 1.0)",
					"skipintro": "Skip Intro Screen (readonly, can only be changed manually in cheats.js)",
					"unlimiteddashes": "Unlimited Dashing",
					"runspeed": "Faster Running",
					"runspeedmultiplier": "Running Multiplier (10 = 1.0)",
					"maxresistance": "100% Element Resistances",
					"instantaim": "Instant Aim",
					"dontresetpuzzles": "Do Not Reset Puzzle Elements on Misfire"
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
	});
	// END: Lang Extension
	function isNewGamePlus() {
		// This is the ONLY method in the game that checks for new game plus and returns a boolean...
		return sc.TitleScreenButtonGui.prototype.checkClearSaveFiles();
	}
	// START: Cheats Menu
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
	function getConfigFilePath() {
		let prefix = "./assets/js/";
		if ("simplify" in window) {
			const cheatsMod = simplify.getMod("Cheats");
			if (cheatsMod) {
				prefix = cheatsMod.baseDirectory;
			}
		}
		return `${prefix}cheats.json`;
	}
	const fsPromises = require("fs").promises;
	// Determine whether we're in CCLoader and if we are we wait for simplify to load.
	new Promise((resolve) => {
		if ("activeMods" in window) {
			document.body.addEventListener("simplifyInitialized", resolve);
		} else {
			resolve();
		}
	}).then(() => {
		// Load the cheat values from the file to initialize.
		fsPromises.readFile(getConfigFilePath(), "utf-8").then((str) => {
			const config = JSON.parse(str);
			for (const [cheat, value] of Object.entries(config)) {
				if (CHEAT_CONFIG_MAP.has(cheat)) {
					const cheatData = CHEAT_CONFIG_MAP.get(cheat);
					switch (cheatData.type) {
						case "CHECKBOX": {
							setCheatValue(cheat, !!value);
							break;
						}
						case "SLIDER": {
							const num = Number(value);
							if (!Number.isNaN(num)) {
								const clamped = Math.max(cheatData.min, Math.min(cheatData.max, num));
								setCheatValue(cheat, clamped);
							}
							break;
						}
					}
				}
			}
		}).catch((err) => {
			// We couldn't read the file or it was malformed so we just stick to the defaults.
		});
	});
	function saveCheatsToFile() {
		return fsPromises.writeFile(getConfigFilePath(), JSON.stringify(getCheatsObject(), null, "\t"), "utf-8");
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
		cheatsChanged: 0,
		cheatsChangedSaved: 0,
		cheatsChangedSaving: false,
		cheatsChangedTimer: -1,
		cheatsChangedTimeout: 5 * 1000, // 5 seconds
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
					this.setCheatValue(control.data.cheat, !!control.pressed);
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
		clearCheatsAutosave() {
			if (this.cheatsChangedTimer !== -1) {
				clearTimeout(this.cheatsChangedTimer);
				this.cheatsChangedTimer = -1;
			}
		},
		setCheatsAutosave() {
			const cheatsChangedSaving = ++this.cheatsChanged;
			if (!this.cheatsChangedSaving) {
				this.clearCheatsAutosave();
				this.cheatsChangedTimer = setTimeout(() => {
					this.cheatsChangedSaving = true;
					saveCheatsToFile().finally(() => {
						this.cheatsChangedSaving = false;
						this.cheatsChangedSaved = cheatsChangedSaving;
						if (this.cheatsChanged > cheatsChangedSaving) {
							this.setCheatsAutosave();
						}
					});
				}, this.cheatsChangedTimeout);
			}
		},
		setCheatValue(cheat, newValue) {
			setCheatValue(cheat, newValue);
			this.setCheatsAutosave();
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
			if (this.cheatsChanged) {
				this.clearCheatsAutosave();
				saveCheatsToFile();
			}
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
			// Get the first button in the second column so we can position our button above it.
			const firstButtonHook = this.buttonGroup.elements[1].find((value) => value).hook;
			this.cheatsButton = new sc.ButtonGui(ig.lang.get("sc.cheats.title"), firstButtonHook.size.x);
			this.cheatsButton.setAlign(firstButtonHook.align.x, firstButtonHook.align.y);
			this.cheatsButton.setPos(firstButtonHook.pos.x, firstButtonHook.pos.y + 28);
			this.cheatsButton.onButtonPress = () => {
				// What menu should be entered when clicked.
				sc.menu.setDirectMode(true, sc.MENU_SUBMENU.CHEATS);
				sc.model.enterMenu(true);
			};
			this.cheatsButton.hook.transitions = firstButtonHook.transitions;
			this.cheatsButton.doStateTransition("HIDDEN", true);
			this.buttonGroup.insertFocusGui(this.cheatsButton, 1, 0);
			this.insertChildGui(this.cheatsButton);
		},
		show() {
			this.parent();
			this.cheatsButton.doStateTransition("DEFAULT");
		},
		hide(timingBoolean) {
			this.parent.apply(this, arguments);
			this.cheatsButton.doStateTransition("HIDDEN", timingBoolean);
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

			// Get the first button in the first column so we can position our button above it.
			const firstButtonHook = this.buttonGroup.elements[0][0].hook;
			// Position our new Cheats button above the current ones.
			this.cheatsButton.setPos(firstButtonHook.pos.x, firstButtonHook.pos.y + firstButtonHook.size.y + 16);
			// Set it to be first in keyboard order, bump the others down.
			this.buttonGroup.insertFocusGui(this.cheatsButton, 0, 0);
		},
	});
	// END: Cheats GUI
});
})();
