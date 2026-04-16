#include "Inventory.h"
#include <cmath>

void Inventory::init() {
    equipment.resize(3);
    backpack.resize(6);

    backpack[0] = Item("Bow", "item_bow.png", ITEM_WEAPON, 25.f);
    backpack[1] = Item("Armor", "item_armor.png", ITEM_ARMOR);
    backpack[2] = Item("Ring", "item_ring.png", ITEM_ACCESSORY);

    // Начальные позиции (будут перезаписаны в updatePositions)
    equipSlotPositions.resize(3);
    backpackSlotPositions.resize(6);

    draggedSprite.setScale(ICON_SCALE, ICON_SCALE);
}

void Inventory::updatePositions(const sf::Sprite& hudSprite) {
    float hudX = hudSprite.getPosition().x; // Левый край HUD
    float hudY = hudSprite.getPosition().y; // Верхний край HUD

    // === НАСТРОЙКИ (ОТДЕЛЬНЫЕ ДЛЯ КАЖДОГО СЛОТА) ===
    // Эти числа — отступы ОТ ЛЕВОГО ВЕРХНЕГО УГЛА hud_bg.png

    // --- СЛОТЫ ЭКИПИРОВКИ (3 штуки) ---
    float equipX0 = 315.f; float equipY0 = 638.f; // Слот 1 (Оружие)
    float equipX1 = 380.f; float equipY1 = 638.f; // Слот 2 (Броня)
    float equipX2 = 445.f; float equipY2 = 638.f; // Слот 3 (Аксессуар)

    // --- СЛОТЫ РЮКЗАКА (6 штук, сетка 2x3) ---
    // Ряд 1 (верхний)
    float bagX0 = 525.f; float bagY0 = 610.f; // Слот 1
    float bagX1 = 590.f; float bagY1 = 610.f; // Слот 2
    float bagX2 = 655.f; float bagY2 = 610.f; // Слот 3

    // Ряд 2 (нижний)
    float bagX3 = 525.f; float bagY3 = 670.f; // Слот 4
    float bagX4 = 590.f; float bagY4 = 670.f; // Слот 5
    float bagX5 = 655.f; float bagY5 = 670.f; // Слот 6
    // ======================================================

    // Применяем позиции (HUD + отступ)
    equipSlotPositions[0] = sf::Vector2f(hudX + equipX0, hudY + equipY0);
    equipSlotPositions[1] = sf::Vector2f(hudX + equipX1, hudY + equipY1);
    equipSlotPositions[2] = sf::Vector2f(hudX + equipX2, hudY + equipY2);

    backpackSlotPositions[0] = sf::Vector2f(hudX + bagX0, hudY + bagY0);
    backpackSlotPositions[1] = sf::Vector2f(hudX + bagX1, hudY + bagY1);
    backpackSlotPositions[2] = sf::Vector2f(hudX + bagX2, hudY + bagY2);
    backpackSlotPositions[3] = sf::Vector2f(hudX + bagX3, hudY + bagY3);
    backpackSlotPositions[4] = sf::Vector2f(hudX + bagX4, hudY + bagY4);
    backpackSlotPositions[5] = sf::Vector2f(hudX + bagX5, hudY + bagY5);
}

void Inventory::update(float deltaTime, const sf::Vector2i& mousePos, bool lmbPressed, bool lmbReleased) {
    sf::Vector2f mouseWorld(static_cast<float>(mousePos.x), static_cast<float>(mousePos.y));

    if (!draggedItem && lmbPressed) {
        for (int i = 0; i < 3; ++i) {
            sf::FloatRect slotRect(equipSlotPositions[i].x, equipSlotPositions[i].y, SLOT_SIZE, SLOT_SIZE);
            if (slotRect.contains(mouseWorld) && equipment[i].type != ITEM_NONE) {
                draggedItem = &equipment[i]; draggedFromIndex = i;
                dragOffset = mouseWorld - sf::Vector2f(equipSlotPositions[i].x + SLOT_SIZE / 2, equipSlotPositions[i].y + SLOT_SIZE / 2);
                draggedSprite.setTexture(draggedItem->texture); return;
            }
        }
        for (int i = 0; i < 6; ++i) {
            sf::FloatRect slotRect(backpackSlotPositions[i].x, backpackSlotPositions[i].y, SLOT_SIZE, SLOT_SIZE);
            if (slotRect.contains(mouseWorld) && backpack[i].type != ITEM_NONE) {
                draggedItem = &backpack[i]; draggedFromIndex = i + 3;
                dragOffset = mouseWorld - sf::Vector2f(backpackSlotPositions[i].x + SLOT_SIZE / 2, backpackSlotPositions[i].y + SLOT_SIZE / 2);
                draggedSprite.setTexture(draggedItem->texture); return;
            }
        }
    }

    if (draggedItem) {
        draggedSprite.setPosition(mouseWorld.x - dragOffset.x - SLOT_SIZE / 2,
            mouseWorld.y - dragOffset.y - SLOT_SIZE / 2);
    }

    if (draggedItem && lmbReleased) {
        bool placed = false;

        for (int i = 0; i < 3; ++i) {
            sf::FloatRect slotRect(equipSlotPositions[i].x, equipSlotPositions[i].y, SLOT_SIZE, SLOT_SIZE);
            if (slotRect.contains(mouseWorld)) {

                // === ИСПРАВЛЕННАЯ ПРОВЕРКА ТИПА ===
                bool canPlace = false;

                // Проверяем: слот 0 = оружие, слот 1 = броня, слот 2 = аксессуар
                if (i == 0 && draggedItem->type == ITEM_WEAPON)
                    canPlace = true;
                else if (i == 1 && draggedItem->type == ITEM_ARMOR)
                    canPlace = true;
                else if (i == 2 && draggedItem->type == ITEM_ACCESSORY)
                    canPlace = true;

                // Если тип подходит — можно класть (неважно, пуст слот или нет)
                if (canPlace) {
                    Item temp = equipment[i];
                    equipment[i] = *draggedItem;
                    equipment[i].isEquipped = true;
                    *draggedItem = temp;
                    draggedItem->isEquipped = false;
                    placed = true;
                    break;
                }
            }
        }

        if (!placed) {
            for (int i = 0; i < 6; ++i) {
                sf::FloatRect slotRect(backpackSlotPositions[i].x, backpackSlotPositions[i].y, SLOT_SIZE, SLOT_SIZE);
                if (slotRect.contains(mouseWorld)) {
                    Item temp = backpack[i];
                    backpack[i] = *draggedItem;
                    backpack[i].isEquipped = false;
                    *draggedItem = temp;
                    draggedItem->isEquipped = false;
                    placed = true;
                    break;
                }
            }
        }

        draggedItem = nullptr; draggedFromIndex = -1;
    }
}

void Inventory::draw(sf::RenderWindow& window) {
    // === РИСУЕМ ПРЕДМЕТЫ (Иконки) ===
    sf::Sprite itemSprite;
    itemSprite.setScale(ICON_SCALE, ICON_SCALE);

    // Экипировка
    for (int i = 0; i < 3; ++i) {
        if (equipment[i].type != ITEM_NONE) {
            itemSprite.setTexture(equipment[i].texture);
            itemSprite.setPosition(equipSlotPositions[i].x, equipSlotPositions[i].y);
            window.draw(itemSprite);
        }
    }

    // Рюкзак
    for (int i = 0; i < 6; ++i) {
        if (backpack[i].type != ITEM_NONE) {
            itemSprite.setTexture(backpack[i].texture);
            itemSprite.setPosition(backpackSlotPositions[i].x, backpackSlotPositions[i].y);
            window.draw(itemSprite);
        }
    }

    // Перетаскиваемый предмет (поверх всего)
    if (draggedItem) {
        window.draw(draggedSprite);
    }
}
