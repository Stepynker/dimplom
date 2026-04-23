#include "Boss.h"
#include <iostream>
#include <cmath>

Boss::Boss()
    : maxHP(300), currentHP(300), alive(true), respawning(false), xpReward(150),
    currentFrame(0), animTimer(0.f), animSpeed(0.2f),
    moveSpeed(150.f), damageCooldown(0.f), type(BOSS_FIRE),
    respawnTimer(0.f), respawnDelay(30.f) {  // Респавн через 30 секунд
}

bool Boss::init(BossType t, sf::Vector2f spawnPos) {
    type = t;
    alive = true;
    respawning = false;
    currentHP = maxHP;
    this->spawnPos = spawnPos;  // Сохраняем точку спавна

    loadTextures(t);

    if (type == BOSS_FIRE) {
        sprite.setTexture(stayTextures[0]);
        sprite.setScale(3.f, 3.f);
        moveSpeed = 120.f;
    }
    else {
        sprite.setTexture(stayTextures[0]);
        sprite.setScale(3.f, 3.f);
        moveSpeed = 150.f;
    }

    sprite.setPosition(spawnPos);
    return true;
}

void Boss::loadTextures(BossType t) {
    if (t == BOSS_FIRE) {
        sf::Texture tex;
        if (tex.loadFromFile("boss1.png")) {
            tex.setSmooth(false);
            stayTextures.push_back(tex);
            std::cout << "Loaded boss1.png" << std::endl;
        }
        else {
            std::cout << "Error: boss1.png not found!" << std::endl;
        }
    }
    else {
        std::string names[] = { "boss2_stay_1_right.png", "boss2_stay_2_left.png" };

        for (int i = 0; i < 2; ++i) {
            sf::Texture tex;
            if (tex.loadFromFile(names[i])) {
                tex.setSmooth(false);
                stayTextures.push_back(tex);
                std::cout << "Loaded " << names[i] << std::endl;
            }
            else {
                std::cout << "Error: " << names[i] << " not found!" << std::endl;
            }
        }
    }
}

void Boss::update(float deltaTime, sf::Vector2f playerPos) {
    // Если босс мёртв — обновляем таймер респавна
    if (!alive && respawning) {
        respawnTimer += deltaTime;

        // Респавн!
        if (respawnTimer >= respawnDelay) {
            reset(spawnPos);
            std::cout << "Boss respawned!" << std::endl;
        }
        return;  // Выход, не двигаемся и не атакуем
    }

    // Если босс жив — обычная логика
    if (!alive) return;

    if (damageCooldown > 0.f) {
        damageCooldown -= deltaTime;
    }

    // Движение к игроку
    sf::Vector2f dir = playerPos - sprite.getPosition();
    float dist = std::sqrt(dir.x * dir.x + dir.y * dir.y);

    if (dist > 60.f) {
        dir /= dist;
        sprite.move(dir * moveSpeed * deltaTime);

        // Для Boss2: выбираем кадр в зависимости от направления
        if (type == BOSS_SLIME && stayTextures.size() >= 2) {
            if (dir.x < 0) {
                sprite.setTexture(stayTextures[1]);
            }
            else {
                sprite.setTexture(stayTextures[0]);
            }
        }
    }
    else {
        // Анимация покоя для Boss2
        if (type == BOSS_SLIME && stayTextures.size() >= 2) {
            animTimer += deltaTime;
            if (animTimer >= animSpeed) {
                currentFrame = (currentFrame + 1) % stayTextures.size();
                sprite.setTexture(stayTextures[currentFrame]);
                animTimer = 0.f;
            }
        }
    }
}

void Boss::draw(sf::RenderWindow& window) {
    if (alive) {
        window.draw(sprite);
    }
}

void Boss::takeDamage(int damage) {
    if (!alive) return;

    currentHP -= damage;
    std::cout << "Boss hit! HP: " << currentHP << "/" << maxHP << std::endl;

    if (currentHP <= 0) {
        alive = false;
        respawning = true;  // Запускаем респавн
        respawnTimer = 0.f;
        std::cout << "BOSS DEFEATED! +" << xpReward << " XP" << std::endl;
        std::cout << "Boss will respawn in " << respawnDelay << "s..." << std::endl;
    }
}

void Boss::reset(sf::Vector2f spawnPos) {
    alive = true;
    respawning = false;
    currentHP = maxHP;
    this->spawnPos = spawnPos;
    sprite.setPosition(spawnPos);
    currentFrame = 0;
    animTimer = 0.f;
    respawnTimer = 0.f;

    // Восстанавливаем текстуру
    if (!stayTextures.empty()) {
        sprite.setTexture(stayTextures[0]);
    }
}
