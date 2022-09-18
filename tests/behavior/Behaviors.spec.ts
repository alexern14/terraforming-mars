import {expect} from 'chai';
import {Game} from '../../src/server/Game';
import {Player} from '../../src/server/Player';
import {TestPlayer} from '../TestPlayer';
import {getTestPlayer, newTestGame} from '../TestGame';
import {Behaviors} from '../../src/server/behavior/Behaviors';
import {Units} from '../../src/common/Units';
import {Payment} from '../../src/common/inputs/Payment';
import {Resources} from '../../src/common/Resources';
import {CardResource} from '../../src/common/CardResource';
import {Tag} from '../../src/common/cards/Tag';
import {CardType} from '../../src/common/cards/CardType';
import {cast, runAllActions} from '../TestingUtils';
import {SelectCard} from '../../src/server/inputs/SelectCard';
import {Tardigrades} from '../../src/server/cards/base/Tardigrades';
import {Ants} from '../../src/server/cards/base/Ants';
import {RegolithEaters} from '../../src/server/cards/base/RegolithEaters';
import {Livestock} from '../../src/server/cards/base/Livestock';

function asUnits(player: Player): Units {
  return {
    megacredits: player.megaCredits,
    steel: player.steel,
    titanium: player.titanium,
    plants: player.plants,
    energy: player.energy,
    heat: player.heat,
  };
}

describe('Behaviors', () => {
  let game: Game;
  let player: TestPlayer;
  let player2: TestPlayer;

  beforeEach(() => {
    game = newTestGame(2, {venusNextExtension: true});
    player = getTestPlayer(game, 0);
    player2 = getTestPlayer(game, 1);
    player.popSelectInitialCards();
    player2.popSelectInitialCards();
  });

  it('production - simple', () => {
    expect(player.production.asUnits()).deep.eq(Units.EMPTY);
    Behaviors.execute({production: {megacredits: 2}}, player);
    expect(player.production.asUnits()).deep.eq(Units.of({megacredits: 2}));
  });

  it('production - negative', () => {
    const behavior = {production: {megacredits: 2, steel: -1}};
    expect(player.production.asUnits()).deep.eq(Units.EMPTY);

    expect(Behaviors.canExecute(behavior, player)).is.false;

    player.production.add(Resources.STEEL, 1);

    expect(Behaviors.canExecute(behavior, player)).is.true;

    Behaviors.execute(behavior, player);
    expect(player.production.asUnits()).deep.eq(Units.of({megacredits: 2, steel: 0}));
  });

  it('production - simple', () => {
    expect(player.production.asUnits()).deep.eq(Units.EMPTY);
    Behaviors.execute({production: {megacredits: 2}}, player);
    expect(player.production.asUnits()).deep.eq(Units.of({megacredits: 2}));
  });

  it('stock - simple', () => {
    player.steel = 2;
    player.heat = 5;
    Behaviors.execute({stock: {steel: 3, heat: 2}}, player);
    expect(asUnits(player)).deep.eq(Units.of({steel: 5, heat: 7}));
  });

  it('steelValue', () => {
    expect(player.payingAmount(Payment.of({steel: 4}), {steel: true})).eq(8);
    Behaviors.execute({steelValue: 1}, player);
    expect(player.payingAmount(Payment.of({steel: 4}), {steel: true})).eq(12);
    Behaviors.onDiscard({steelValue: 1}, player);
    expect(player.payingAmount(Payment.of({steel: 4}), {steel: true})).eq(8);
  });

  it('titaniumValue', () => {
    expect(player.payingAmount(Payment.of({titanium: 4}), {titanium: true})).eq(12);
    Behaviors.execute({titanumValue: 1}, player);
    expect(player.payingAmount(Payment.of({titanium: 4}), {titanium: true})).eq(16);
    Behaviors.onDiscard({titanumValue: 1}, player);
    expect(player.payingAmount(Payment.of({titanium: 4}), {titanium: true})).eq(12);
  });

  it('greeneryDiscount', () => {
    player.plants = 8;
    expect(game.canPlaceGreenery(player)).is.true;

    player.plants = 7;
    expect(game.canPlaceGreenery(player)).is.false;

    Behaviors.execute({greeneryDiscount: 1}, player);
    expect(game.canPlaceGreenery(player)).is.true;

    player.plants = 6;
    expect(game.canPlaceGreenery(player)).is.false;

    Behaviors.execute({greeneryDiscount: 1}, player);
    expect(game.canPlaceGreenery(player)).is.true;

    Behaviors.onDiscard({greeneryDiscount: 1}, player);
    expect(game.canPlaceGreenery(player)).is.false;

    player.plants = 7;
    expect(game.canPlaceGreenery(player)).is.true;
  });

  it('drawCard - simple', () => {
    expect(player.cardsInHand).has.length(0);
    player.megaCredits = 5;
    Behaviors.execute({drawCard: 3}, player);
    expect(player.cardsInHand).has.length(3);
    expect(player.megaCredits).eq(5);
  });

  it('drawCard, resource type', () => {
    expect(player.cardsInHand).has.length(0);
    Behaviors.execute({drawCard: {count: 3, resource: CardResource.MICROBE}}, player);
    expect(player.cardsInHand).has.length(3);
    expect(player.cardsInHand[0].resourceType).eq(CardResource.MICROBE);
    expect(player.cardsInHand[1].resourceType).eq(CardResource.MICROBE);
    expect(player.cardsInHand[2].resourceType).eq(CardResource.MICROBE);
  });

  it('drawCard, tag', () => {
    expect(player.cardsInHand).has.length(0);
    Behaviors.execute({drawCard: {count: 3, tag: Tag.BUILDING}}, player);
    expect(player.cardsInHand).has.length(3);
    expect(player.cardsInHand[0].tags).contains(Tag.BUILDING);
    expect(player.cardsInHand[1].tags).contains(Tag.BUILDING);
    expect(player.cardsInHand[2].tags).contains(Tag.BUILDING);
  });

  it('drawCard, type and tag', () => {
    expect(player.cardsInHand).has.length(0);
    player.megaCredits = 5;
    Behaviors.execute({drawCard: {count: 3, tag: Tag.SPACE, type: CardType.EVENT}}, player);
    expect(player.cardsInHand).has.length(3);
    expect(player.cardsInHand[0].tags).contains(Tag.SPACE);
    expect(player.cardsInHand[1].tags).contains(Tag.SPACE);
    expect(player.cardsInHand[2].tags).contains(Tag.SPACE);
    expect(player.cardsInHand[0].cardType).eq(CardType.EVENT);
    expect(player.cardsInHand[1].cardType).eq(CardType.EVENT);
    expect(player.cardsInHand[2].cardType).eq(CardType.EVENT);
    expect(player.megaCredits).eq(5);
  });

  it('drawCard, type and tag, keep some', () => {
    expect(player.cardsInHand).has.length(0);
    player.megaCredits = 5;

    Behaviors.execute({drawCard: {count: 3, tag: Tag.SPACE, type: CardType.EVENT, keep: 2}}, player);

    runAllActions(game);

    const selectCard = cast(player.popWaitingFor(), SelectCard);
    expect(selectCard.cards).has.length(3);
    expect(selectCard.config.max).eq(2);
    expect(selectCard.config.min).eq(2);
    const cards = selectCard.cards;
    selectCard.cb([cards[0], cards[1]]);
    expect(player.cardsInHand).has.length(2);
    expect(player.megaCredits).eq(5);
  });

  it('drawCard, pay', () => {
    expect(player.cardsInHand).has.length(0);
    player.megaCredits = 5;
    Behaviors.execute({drawCard: {count: 1, pay: true}}, player);

    runAllActions(game);

    const selectCard = cast(player.popWaitingFor(), SelectCard);
    selectCard.cb([selectCard.cards[0]]);
    runAllActions(game);

    expect(player.cardsInHand).has.length(1);
    expect(player.megaCredits).eq(2);
  });

  it('global parameters', () => {
    function levels(): [number, number, number] {
      return [game.getTemperature(), game.getOxygenLevel(), game.getVenusScaleLevel()];
    }

    expect(levels()).deep.eq([-30, 0, 0]);

    Behaviors.execute({global: {temperature: 2}}, player);
    expect(levels()).deep.eq([-26, 0, 0]);

    Behaviors.execute({global: {oxygen: 1}}, player);
    expect(levels()).deep.eq([-26, 1, 0]);

    Behaviors.execute({global: {venus: 1}}, player);
    expect(levels()).deep.eq([-26, 1, 2]);

    Behaviors.execute({global: {temperature: 1, oxygen: 2, venus: 3}}, player);
    expect(levels()).deep.eq([-24, 3, 8]);
  });

  it('tr', () => {
    expect(player.getTerraformRating()).eq(20);

    Behaviors.execute({tr: 2}, player);

    expect(player.getTerraformRating()).eq(22);

    Behaviors.execute({tr: -1}, player);

    expect(player.getTerraformRating()).eq(21);
  });

  it('add resources to specific card', () => {
    // Cards are necessary when adding resource to self.
    expect(() => Behaviors.execute({addResources: 3}, player)).to.throw();

    const card = new Tardigrades();
    card.resourceCount = 2;
    Behaviors.execute({addResources: 3}, player, card);
    runAllActions(game);

    expect(card.resourceCount).eq(5);
  });

  // TODO(kberg): Add test where type includes multiple resource types
  // TODO(kberg): Add test taht filters on card tags.
  it('add resources to any card', () => {
    const tardigrades = new Tardigrades(); // Holds microbes
    const ants = new Ants(); // Holds microbes
    const regolithEathers = new RegolithEaters(); // Holds microbes
    const livestock = new Livestock(); // Holds animals

    function resourceCount() {
      return {
        tardigrades: tardigrades.resourceCount,
        ants: ants.resourceCount,
        regolithEathers: regolithEathers.resourceCount,
        livestock: livestock.resourceCount,
      };
    }

    player.playedCards = [tardigrades, ants, regolithEathers, livestock];

    expect(resourceCount()).deep.eq({
      tardigrades: 0,
      ants: 0,
      regolithEathers: 0,
      livestock: 0,
    });

    // No floater cards.
    Behaviors.execute({addResourcesToAnyCard: {count: 2, type: CardResource.FLOATER}}, player);
    runAllActions(game);

    expect(player.popWaitingFor()).is.undefined;
    expect(resourceCount()).deep.eq({
      tardigrades: 0,
      ants: 0,
      regolithEathers: 0,
      livestock: 0,
    });

    // One animal card. Auto-populated.
    Behaviors.execute({addResourcesToAnyCard: {count: 2, type: CardResource.ANIMAL}}, player);
    runAllActions(game);
    expect(player.popWaitingFor()).is.undefined;

    expect(resourceCount()).deep.eq({
      tardigrades: 0,
      ants: 0,
      regolithEathers: 0,
      livestock: 2,
    });

    // Three microbe cards. Player is asked to choose.
    Behaviors.execute({addResourcesToAnyCard: {count: 1, type: CardResource.MICROBE}}, player);
    runAllActions(game);
    const selectCard = cast(player.popWaitingFor(), SelectCard);

    expect(selectCard.cards).has.members([tardigrades, ants, regolithEathers]);

    selectCard.cb([ants]);

    expect(resourceCount()).deep.eq({
      tardigrades: 0,
      ants: 1,
      regolithEathers: 0,
      livestock: 2,
    });
  });
});
