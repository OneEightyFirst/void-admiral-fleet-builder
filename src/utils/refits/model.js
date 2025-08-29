/**
 * @typedef {"capital" | "squadron"} RefitScope
 * @typedef {"Front"|"Sides"|"Rear"|"Fr/Sd"|"Fr/Re"|"Sd/Re"|"Sides/Rear"|"360"|"Any"} Arc
 * @typedef {"missiles"|"lasers"|"cannons"|"launch_bays"|"other"} WeaponKind
 *
 * @typedef {number|"-"} NumOrDash
 * @typedef {number|{dice:string, star?:boolean, scalesWith?:"fighterTokens"|"droneTokens"|"sporeTokens"|string}} NumOrDice
 *
 * @typedef {{ name:string, kind:WeaponKind, targets?:Arc, attacks?:NumOrDice, range?:NumOrDash, ignoresShields?:boolean }} WeaponSpec
 *
 * @typedef {("Armoured Prows"|"Agile Maneuvers"|"Small Target"|string)} Keyword
 *
 * @typedef {Object} Capabilities
 * @property {boolean} [boardAndShootSameActivation]
 * @property {boolean} [canLaunchBombingRuns]
 *
 * @typedef {"prow"|"hull"|"turret"|"any"} WeaponSlot
 *
 * @typedef {{ slot:WeaponSlot, kindAny?:WeaponKind[], nameAny?:string[] }} WeaponSelector
 *
 * @typedef {"Hull"|"Speed"|"Armour"|"Shields"|"Flak"} StatName
 * @typedef {Record<StatName, number>} StatsDelta
 *
 * @typedef {Object} Refit
 * @property {string} name
 * @property {string} description
 * @property {RefitScope} scope
 * @property {{ shipTagsAny?:string[], shipClassesAny?:string[], hasWeapon?:Array<{slot:WeaponSlot, kindAny?:WeaponKind[], nameAny?:string[]}> }} [requirements]
 * @property {{ loseKeywords?:Keyword[], loseSlots?:Array<{slot:WeaponSlot, count:number}>, statDeltas?:Partial<StatsDelta> }} [cost]
 * @property {{ addKeywords?:Keyword[], capabilities?:Capabilities, statDeltas?:Partial<StatsDelta> }} [gains]
 * @property {{
 *   unlockOptions?:Array<{slot:WeaponSlot, allowKindsAny?:WeaponKind[], allowNamesAny?:string[]}>,
 *   replace?:Array<{slot:WeaponSlot, selector:WeaponSelector, to:WeaponSpec}>,
 *   add?:Array<{slot:WeaponSlot, weapon:WeaponSpec}>,
 *   modify?:Array<{selector:WeaponSelector, changes?:{attacksDelta?:number|{multiply:number}, rangeDelta?:number, toHitDelta?:number, setTargets?:Arc}}>
 * }} [weaponChanges]
 * @property {{ diceDelta?:number, multiplier?:number, perFighterTokenBonus?:number }} [boarding]
 * @property {{ toHitDelta?:number, attacksDelta?:number, autoSelfDestructOnRam?:boolean }} [ramming]
 * @property {{ deployOutsideZoneInches?:number }} [deployment]
 * @property {{ hasDroneBays?:boolean, hasHiveBays?:boolean, hasLaunchBays?:boolean }} [tokens]
 * @property {{ smallTarget?:boolean }} [targetProfile]
 * @property {{ armourMax?:number, speedMin?:number }} [constraints]
 * @property {string[]} [notes]
 */

// Export empty object for JSDoc type definitions
export const __types = {};
