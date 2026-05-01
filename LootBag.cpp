#include "LootBag.h"
#include <iostream>
#include <cmath>

LootBag::LootBag() : active(false), bobTimer(0.f), bobOffset(0.f) {
    if (!texture.loadFromFile("loot_bag.png")) {
        std::cout << "Error: loot_bag.png not found!" << std::endl;
        texture.create(16, 16); // Заглушка
    }
    texture.setSmooth(false);
    sprite.setTexture(texture);
    sprite.setScale(2.f, 2.f);
}

void LootBag::init(sf::Vector2f position, const std::vector<Item>& lootItems) {
    items = lootItems;
    sprite.setPosition(position);
    active = true;
    bobTimer = 0.f;
}

void LootBag::update() {
    if (!active) return;
    // Анимация "парения" мешочка
    bobTimer += 0.1f;
    bobOffset = std::sin(bobTimer) * 3.f;
    sprite.setPosition(sprite.getPosition().x,
        sprite.getPosition().y - bobOffset + std::sin(bobTimer - 0.1f) * 3.f);
}

void LootBag::draw(sf::RenderWindow& window) {
    if (active) {
        window.draw(sprite);
    }
}

// === НОВЫЙ МЕТОД ===
void LootBag::removeItem(int index) {
    if (index >= 0 && index < items.size()) {
        // Помечаем предмет как пустой
        items[index] = Item(); // Пустой предмет (ITEM_NONE)

        // Проверяем, остались ли предметы
        bool hasItems = false;
        for (const auto& item : items) {
            if (item.type != ITEM_NONE) {
                hasItems = true;
                break;
            }
        }

        // Если предметов нет — деактивируем мешочек
        if (!hasItems) {
            active = false;
            std::cout << "Loot bag emptied!" << std::endl;
        }
    }
}
