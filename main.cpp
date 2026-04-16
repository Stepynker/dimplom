#include <SFML/Graphics.hpp>
#include <iostream>
#include <vector>
#include "Portal.h"
#include "Plain.h"
#include "Inventory.h"
#include "Arrow.h"
#include <string>

int main()
{
    // ОКНО НА ВЕСЬ ЭКРАН 
    sf::RenderWindow window(sf::VideoMode::getFullscreenModes()[0], "My Pixel RPG", sf::Style::Fullscreen);
    window.setFramerateLimit(60);

    // === ПРОВЕРКА РАЗРЕШЕНИЯ ===
    sf::Vector2u resolution = window.getSize();
    std::cout << "Screen resolution: " << resolution.x << "x" << resolution.y << std::endl;

    // РАЗМЕР МИРА
    const int WORLD_WIDTH = 1024;
    const int WORLD_HEIGHT = 1024;

    // === ЗАГРУЗКА ГЕРОЯ ===
    std::vector<sf::Texture> texturesDown(4);
    std::vector<sf::Texture> texturesUp(4);
    std::vector<sf::Texture> texturesLeft(4);
    std::vector<sf::Texture> texturesRight(4);

    for (int i = 1; i <= 4; i++) {
        texturesDown[i - 1].loadFromFile("hero_down_" + std::to_string(i) + ".png");
        texturesUp[i - 1].loadFromFile("hero_up_" + std::to_string(i) + ".png");
        texturesLeft[i - 1].loadFromFile("hero_left_" + std::to_string(i) + ".png");
        texturesRight[i - 1].loadFromFile("hero_right_" + std::to_string(i) + ".png");

        texturesDown[i - 1].setSmooth(false);
        texturesUp[i - 1].setSmooth(false);
        texturesLeft[i - 1].setSmooth(false);
        texturesRight[i - 1].setSmooth(false);
    }

    // === ИНВЕНТАРЬ ===
    Inventory inventory;
    inventory.init();

    // === СТРЕЛА ===
    Arrow arrow;

    // === ПАРАМЕТРЫ ДЭША ===
    const float DASH_SPEED = 800.f;
    const float DASH_DURATION = 0.15f;
    const float DASH_COOLDOWN = 2.0f;

    // === ПОРТАЛ ===
    Portal portal(900, 64);

    // === ТЕКСТУРЫ АТАКИ ===
    std::vector<sf::Texture> atkDown(2), atkUp(2), atkLeft(2), atkRight(2);
    for (int i = 1; i <= 2; i++) {
        atkDown[i - 1].loadFromFile("atk_down_" + std::to_string(i) + ".png");
        atkUp[i - 1].loadFromFile("atk_up_" + std::to_string(i) + ".png");
        atkLeft[i - 1].loadFromFile("atk_left_" + std::to_string(i) + ".png");
        atkRight[i - 1].loadFromFile("atk_right_" + std::to_string(i) + ".png");

        atkDown[i - 1].setSmooth(false);
        atkUp[i - 1].setSmooth(false);
        atkLeft[i - 1].setSmooth(false);
        atkRight[i - 1].setSmooth(false);
    }

    // === ПЕРЕМЕННЫЕ ДЭША ===
    bool isDashing = false;
    float dashTimer = 0.f;
    float dashCooldown = 0.f;
    sf::Vector2f dashDirection(0.f, 0.f);
    const float WALK_SPEED_MODIFIER = 0.5f;
    // === КАРТА МИРА ===
    sf::Texture mapTexture;
    mapTexture.loadFromFile("map.png");
    mapTexture.setSmooth(false);
    sf::Sprite mapSprite(mapTexture);
    mapSprite.setPosition(0, 0);

    // === ОБЪЕКТЫ ДЛЯ КОЛЛИЗИИ ===
    std::vector<sf::RectangleShape> obstacles;
    float wallThickness = 45;

    sf::RectangleShape borderTop(sf::Vector2f(WORLD_WIDTH, wallThickness)); borderTop.setPosition(0, 0); borderTop.setFillColor(sf::Color::Transparent); obstacles.push_back(borderTop);
    sf::RectangleShape borderBottom(sf::Vector2f(WORLD_WIDTH, wallThickness)); borderBottom.setPosition(0, WORLD_HEIGHT - wallThickness); borderBottom.setFillColor(sf::Color::Transparent); obstacles.push_back(borderBottom);
    sf::RectangleShape borderLeft(sf::Vector2f(wallThickness, WORLD_HEIGHT)); borderLeft.setPosition(0, 0); borderLeft.setFillColor(sf::Color::Transparent); obstacles.push_back(borderLeft);
    sf::RectangleShape borderRight(sf::Vector2f(wallThickness, WORLD_HEIGHT)); borderRight.setPosition(WORLD_WIDTH - wallThickness, 0); borderRight.setFillColor(sf::Color::Transparent); obstacles.push_back(borderRight);

    // === УПРАВЛЕНИЕ ЛОКАЦИЯМИ ===
    PlainLocation plainLoc;
    plainLoc.load();

    const std::vector<sf::RectangleShape>* currentCollisions = &obstacles;
    int currentLocationID = 0;

    // === МИНИ-КАРТА ===
    sf::Texture minimapFrameTexture;
    minimapFrameTexture.loadFromFile("minimap_frame.png");
    sf::Sprite minimapFrameSprite(minimapFrameTexture);

    sf::Texture minimapWorldTextureCave;  // <-- Переименовал для ясности
    minimapWorldTextureCave.loadFromFile("minimap_map.png"); // Твоя старая карта (Cave)
    sf::Sprite minimapWorldSprite(minimapWorldTextureCave);

    sf::Texture minimapWorldTexturePlain; // <-- Новая текстура для Plain
    minimapWorldTexturePlain.loadFromFile("minimap_plain.png");

    // Точки
    sf::RectangleShape playerDot(sf::Vector2f(4, 4));
    playerDot.setFillColor(sf::Color(255, 0, 0));

    sf::RectangleShape portalDotTemp(sf::Vector2f(4, 4));
    portalDotTemp.setFillColor(sf::Color(0, 255, 0));

    // === HUD ===
    sf::Texture texHudBg;
    texHudBg.loadFromFile("hud_bg.png"); texHudBg.setSmooth(false); sf::Sprite hudBg(texHudBg);
    sf::Texture texHp; texHp.loadFromFile("hp_bar.png"); texHp.setSmooth(false); sf::Sprite hpBar(texHp);
    sf::Texture texMp; texMp.loadFromFile("mp_bar.png"); texMp.setSmooth(false); sf::Sprite mpBar(texMp);
    sf::Texture texXp; texXp.loadFromFile("xp_bar.png"); texXp.setSmooth(false); sf::Sprite xpBar(texXp);
    sf::Texture texWeapon; texWeapon.loadFromFile("weapon_bar.png"); texWeapon.setSmooth(false); sf::Sprite weaponBar(texWeapon);
    sf::Texture texInv; texInv.loadFromFile("inv_bar.png"); texInv.setSmooth(false); sf::Sprite invBar(texInv);

    // === ГЕРОЙ ===
    sf::Sprite hero(texturesDown[0]);
    hero.setPosition(512, 512);
    hero.setScale(2.f, 2.f);

    // === КАМЕРА ===
    sf::View camera;
    camera.setSize(1280, 720);
    camera.setCenter(512, 512);

    // === ПЕРЕМЕННЫЕ ===
    int currentFrame = 0;
    float animationSpeed = 0.15f;
    float animationTimer = 0.f;
    int currentDirection = 0;
    bool isMoving = false;
    float speed = 250.0f;
    sf::Clock clock;

    bool isAttacking = false;
    int attackFrame = 0;
    float attackTimer = 0.f;
    const float ATTACK_SPEED = 0.2f;

    // === ФУНКЦИЯ ПРОВЕРКИ КОЛЛИЗИЙ ===
    auto checkCollision = [&](sf::FloatRect heroRect) -> bool {
        for (auto& obstacle : *currentCollisions) {
            if (heroRect.intersects(obstacle.getGlobalBounds()))
                return true;
        }
        return false;
        };

    while (window.isOpen())
    {
        sf::Event event;
        while (window.pollEvent(event)) {
            if (event.type == sf::Event::Closed) window.close();
            if (event.type == sf::Event::KeyPressed && event.key.code == sf::Keyboard::Escape)
                window.close();
        }

        float deltaTime = clock.restart().asSeconds();
        sf::Vector2u winSize = window.getSize();

        // === ТЕЛЕПОРТАЦИЯ ===
        if (portal.isPlayerInside(hero.getGlobalBounds())) {
            if (currentLocationID == 0) {
                currentLocationID = 1;
                currentCollisions = &plainLoc.getObstacles();
                hero.setPosition(plainLoc.getSpawnPos());
                std::cout << "Teleport to Plain!" << std::endl;
            }
            else {
                currentLocationID = 0;
                currentCollisions = &obstacles;
                hero.setPosition(512, 512);
                std::cout << "Teleport to Cave!" << std::endl;
            }
            portal.resetTrigger();
        }

        // === ВВОД ДВИЖЕНИЯ ===
        sf::Vector2f movement(0.f, 0.f);
        isMoving = false;

        if (sf::Keyboard::isKeyPressed(sf::Keyboard::W)) { movement.y -= 1.f; currentDirection = 1; isMoving = true; }
        else if (sf::Keyboard::isKeyPressed(sf::Keyboard::S)) { movement.y += 1.f; currentDirection = 0; isMoving = true; }
        if (sf::Keyboard::isKeyPressed(sf::Keyboard::A)) { movement.x -= 1.f; currentDirection = 2; isMoving = true; }
        else if (sf::Keyboard::isKeyPressed(sf::Keyboard::D)) { movement.x += 1.f; currentDirection = 3; isMoving = true; }

        if (movement.x != 0 || movement.y != 0) {
            float length = std::sqrt(movement.x * movement.x + movement.y * movement.y);
            movement.x /= length;
            movement.y /= length;
        }

        portal.update(deltaTime);
        arrow.update(deltaTime);

        // === ПРОВЕРКА СТОЛКНОВЕНИЙ СТРЕЛЫ С ВРАГАМИ ===
        if (arrow.isActive() && currentLocationID == 1) { // Только на поляне
            auto& enemies = plainLoc.getEnemyManager().getEnemies();
            for (auto& enemy : enemies) {
                if (arrow.getBounds().intersects(enemy.getBounds())) {
                    // Попадание! Здесь потом добавим урон врагу
                    std::cout << "Arrow hit enemy!" << std::endl;
                    arrow.deactivate();
                    break;
                }
            }
        }


        // === ОБНОВЛЕНИЕ ЛОКАЦИИ (ВРАГИ) ===
        if (currentLocationID == 1) {
            // Если мы на поляне, обновляем врагов
            plainLoc.update(deltaTime, hero.getPosition());
        }
        // === ОБРАБОТКА ПРОБЕЛА (ДЭШ) ===
        if (sf::Keyboard::isKeyPressed(sf::Keyboard::Space) && !isDashing && dashCooldown <= 0.f) {
            sf::Vector2f dir(0.f, 0.f);
            if (sf::Keyboard::isKeyPressed(sf::Keyboard::W)) dir.y -= 1.f;
            if (sf::Keyboard::isKeyPressed(sf::Keyboard::S)) dir.y += 1.f;
            if (sf::Keyboard::isKeyPressed(sf::Keyboard::A)) dir.x -= 1.f;
            if (sf::Keyboard::isKeyPressed(sf::Keyboard::D)) dir.x += 1.f;

            float len = std::sqrt(dir.x * dir.x + dir.y * dir.y);
            if (len > 0.f) {
                dir /= len;
                isDashing = true;
                dashTimer = DASH_DURATION;
                dashDirection = dir;
                dashCooldown = DASH_COOLDOWN;
            }
        }

        // === ОБНОВЛЕНИЕ ТАЙМЕРОВ ДЭША ===
        if (dashCooldown > 0.f) dashCooldown -= deltaTime;
        if (isDashing) {
            dashTimer -= deltaTime;
            if (dashTimer <= 0.f) {
                isDashing = false;
            }
        }

        // === ДВИЖЕНИЕ И КОЛЛИЗИЯ ===
        // Вычисляем текущую скорость
        float currentSpeed = speed;
        if (sf::Keyboard::isKeyPressed(sf::Keyboard::LShift) || sf::Keyboard::isKeyPressed(sf::Keyboard::RShift)) {
            currentSpeed *= WALK_SPEED_MODIFIER;  // Замедляемся
        }

        if (isDashing) {
            // ДЭШ: быстрое движение с коллизиями
            sf::Vector2f oldPos = hero.getPosition();
            hero.move(dashDirection * DASH_SPEED * deltaTime);
            if (checkCollision(hero.getGlobalBounds())) {
                hero.setPosition(oldPos);
                hero.move(-dashDirection * 5.f);  // лёгкий отскок от стены
            }
            // Границы мира
            sf::FloatRect bounds = hero.getGlobalBounds();
            if (bounds.left < 0) hero.setPosition(0, hero.getPosition().y);
            if (bounds.top < 0) hero.setPosition(hero.getPosition().x, 0);
            if (bounds.left + bounds.width > WORLD_WIDTH)
                hero.setPosition(WORLD_WIDTH - bounds.width, hero.getPosition().y);
            if (bounds.top + bounds.height > WORLD_HEIGHT)
                hero.setPosition(hero.getPosition().x, WORLD_HEIGHT - bounds.height);
        }
        else if (isMoving) {
            // Обычное движение с коллизиями (с учётом currentSpeed)
            sf::Vector2f oldPos = hero.getPosition();
            hero.move(movement.x * currentSpeed * deltaTime, 0);
            if (checkCollision(hero.getGlobalBounds())) hero.setPosition(oldPos);

            oldPos = hero.getPosition();
            hero.move(0, movement.y * currentSpeed * deltaTime);
            if (checkCollision(hero.getGlobalBounds())) hero.setPosition(oldPos);

            // Границы мира
            sf::FloatRect bounds = hero.getGlobalBounds();
            if (bounds.left < 0) hero.setPosition(0, hero.getPosition().y);
            if (bounds.top < 0) hero.setPosition(hero.getPosition().x, 0);
            if (bounds.left + bounds.width > WORLD_WIDTH)
                hero.setPosition(WORLD_WIDTH - bounds.width, hero.getPosition().y);
            if (bounds.top + bounds.height > WORLD_HEIGHT)
                hero.setPosition(hero.getPosition().x, WORLD_HEIGHT - bounds.height);
        }

        // === АНИМАЦИЯ ===
        if (isAttacking) {
            attackTimer += deltaTime;
            if (attackTimer >= ATTACK_SPEED) {
                attackFrame = (attackFrame + 1) % 2;
                attackTimer = 0.f;

                // Сброс атаки после 2 кадров
                if (attackFrame == 0) {
                    isAttacking = false;
                }
            }

            switch (currentDirection) {
            case 0: hero.setTexture(atkDown[attackFrame]); break;
            case 1: hero.setTexture(atkUp[attackFrame]); break;
            case 2: hero.setTexture(atkLeft[attackFrame]); break;
            case 3: hero.setTexture(atkRight[attackFrame]); break;
            }
        }
        else if (isDashing) {
        }
        else if (isMoving) {
            animationTimer += deltaTime;
            if (animationTimer >= animationSpeed) {
                currentFrame = (currentFrame + 1) % 4;
                animationTimer = 0.f;
                switch (currentDirection) {
                case 0: hero.setTexture(texturesDown[currentFrame]); break;
                case 1: hero.setTexture(texturesUp[currentFrame]); break;
                case 2: hero.setTexture(texturesLeft[currentFrame]); break;
                case 3: hero.setTexture(texturesRight[currentFrame]); break;
                }
            }
        }
        else {
            switch (currentDirection) {
            case 0: hero.setTexture(texturesDown[0]); break;
            case 1: hero.setTexture(texturesUp[0]); break;
            case 2: hero.setTexture(texturesLeft[0]); break;
            case 3: hero.setTexture(texturesRight[0]); break;
            }
        }

        camera.setCenter(hero.getPosition());

        // === ОТРИСОВКА ===
        window.clear(sf::Color(20, 20, 20));
        window.setView(camera);


        if (currentLocationID == 0) {
            window.draw(mapSprite);
        }
        else {
            plainLoc.draw(window);
        }


        portal.draw(window);
        window.draw(hero);
        arrow.draw(window);

        // === HUD ===
        window.setView(window.getDefaultView());

        float hudScale = 6.0f;
        hudBg.setScale(hudScale, hudScale);
        float bgWidth = hudBg.getGlobalBounds().width;
        float bgHeight = hudBg.getGlobalBounds().height;
        hudBg.setPosition((winSize.x - bgWidth) / 2.f, winSize.y - bgHeight - 50);
        window.draw(hudBg);

        hpBar.setScale(4.0f, 4.0f); hpBar.setPosition(500, 650); window.draw(hpBar);
        mpBar.setScale(4.0f, 4.0f); mpBar.setPosition(500, 710); window.draw(mpBar);
        xpBar.setScale(4.0f, 4.0f); xpBar.setPosition(495, 760); window.draw(xpBar);
        weaponBar.setScale(4.0f, 4.0f); weaponBar.setPosition(740, 715); window.draw(weaponBar);
        invBar.setScale(4.0f, 4.0f); invBar.setPosition(950, 690); window.draw(invBar);


        // === ОБРАБОТКА ЛКМ ===
        static bool prevLmbState = false;
        bool currentLmbState = sf::Mouse::isButtonPressed(sf::Mouse::Left);
        bool lmbPressed = currentLmbState && !prevLmbState;
        bool lmbReleased = !currentLmbState && prevLmbState;
        bool lmbHeld = currentLmbState;
        prevLmbState = currentLmbState;

        sf::Vector2i mousePos = sf::Mouse::getPosition(window);
        sf::Vector2f mouseWorld = window.mapPixelToCoords(mousePos, camera);

        // === ЗОНА HUD ===
        float hudX = 600.f;    // Левый край панели
        float hudY = 850.f;    // Верхний край панели (низ экрана)
        float hudW = 700.f;   // Ширина панели
        float hudH = 150.f;    // Высота панели

        sf::FloatRect hudRect(hudX, hudY, hudW, hudH);
        bool clickedOnHUD = hudRect.contains(static_cast<float>(mousePos.x), static_cast<float>(mousePos.y));

        // === СТРЕЛЬБА ===
        if (lmbHeld && !clickedOnHUD) {
            const auto& equipment = inventory.getEquipment();
            if (equipment[0].type != ITEM_NONE && !arrow.isActive()) {
                arrow.deactivate();
                std::cout << "SHOOT!" << std::endl;

                sf::Vector2f heroCenter(
                    hero.getPosition().x + 16,
                    hero.getPosition().y + 16
                );

                sf::Vector2f toMouse = mouseWorld - heroCenter;
                float len = std::sqrt(toMouse.x * toMouse.x + toMouse.y * toMouse.y);
                if (len > 0.f) toMouse /= len;

                arrow.shoot(heroCenter, toMouse, equipment[0].damage);

                if (!isAttacking) {
                    isAttacking = true;
                    attackFrame = 0;
                    attackTimer = 0.f;
                }
            }
        }

        if (lmbReleased) {
            isAttacking = false;
        }

        // Направление героя
        sf::Vector2f toMouseDir = mouseWorld - hero.getPosition();
        float dx = toMouseDir.x;
        float dy = toMouseDir.y;

        if (std::abs(dx) > std::abs(dy)) {
            if (dx > 0) currentDirection = 3;
            else currentDirection = 2;
        }
        else {
            if (dy > 0) currentDirection = 0;
            else currentDirection = 1;
        }

        // Инвентарь
        if (!lmbHeld || clickedOnHUD) {
            inventory.update(deltaTime, mousePos, lmbPressed, lmbReleased);
        }



        // === ОБНОВЛЯЕМ ПОЗИЦИИ ИНВЕНТАРЯ ОТНОСИТЕЛЬНО HUD ===
        inventory.updatePositions(hudBg); 
        inventory.draw(window);            // Рисуем предметы

        // === МИНИ-КАРТА ===
        float minimapUI_W = 200;
        float minimapUI_H = 200;
        float paddingX = 20;
        float paddingY = 20;
        float uiPosX = winSize.x - minimapUI_W - paddingX;
        float uiPosY = paddingY;

        // 1. Рисуем РАМКУ
        minimapFrameSprite.setPosition(uiPosX, uiPosY);
        minimapFrameSprite.setScale(minimapUI_W / minimapFrameTexture.getSize().x,
            minimapUI_H / minimapFrameTexture.getSize().y);
        window.draw(minimapFrameSprite);

        // 2. Выбираем нужную карту мира в зависимости от локации
        if (currentLocationID == 0) {
            // Локация Cave
            minimapWorldSprite.setTexture(minimapWorldTextureCave);
        }
        else {
            // Локация Plain
            minimapWorldSprite.setTexture(minimapWorldTexturePlain);
        }

        // 3. Рисуем выбранную карту
        float mapInnerX = uiPosX + 20;
        float mapInnerY = uiPosY + 20;
        float mapInnerSize = minimapUI_W - 40;

        minimapWorldSprite.setPosition(mapInnerX, mapInnerY);
        minimapWorldSprite.setScale(mapInnerSize / minimapWorldSprite.getTexture()->getSize().x,
            mapInnerSize / minimapWorldSprite.getTexture()->getSize().y);
        window.draw(minimapWorldSprite);

        // 4. Точка игрока (логика та же, так как WORLD_WIDTH/HEIGHT одинаковы)
        float heroRatioX = hero.getPosition().x / WORLD_WIDTH;
        float heroRatioY = hero.getPosition().y / WORLD_HEIGHT;
        float dotX = mapInnerX + (heroRatioX * mapInnerSize);
        float dotY = mapInnerY + (heroRatioY * mapInnerSize);
        playerDot.setPosition(dotX - 2, dotY - 2);
        window.draw(playerDot);

        // 5. Точка портала (показываем только если мы в той локации, где портал есть)
        // Портал есть только в Cave (ID 0)
        if (currentLocationID == 0) {
            float portalRatioX = 850.0f / WORLD_WIDTH;
            float portalRatioY = 64.0f / WORLD_HEIGHT;
            float portalDotX = mapInnerX + (portalRatioX * mapInnerSize);
            float portalDotY = mapInnerY + (portalRatioY * mapInnerSize);
            portalDotTemp.setPosition(portalDotX - 2, portalDotY - 2);
            window.draw(portalDotTemp);
        }
        window.display();
    }

    return 0;
}
