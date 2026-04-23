#include <SFML/Graphics.hpp>
#include <iostream>
#include <vector>
#include "Portal.h"
#include "Plain.h"
#include "Inventory.h"
#include "Arrow.h"
#include "SaveSystem.h"
#include "Menu.h"
#include "BossLocation.h"
#include "Boss.h"
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

    // === КУЛДАУН СТРЕЛЬБЫ ===
    float shootCooldown = 0.f;           // Текущий таймер
    const float shootCooldownTime = 0.5f; // 0.5 секунды между выстрелами

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
    // === МЕНЕДЖЕР ПОРТАЛОВ ===
    PortalManager portalManager;
    portalManager.loadTextures(); // Загружаем текстуры

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

    // === БОССЫ ===
    Boss boss1, boss2;
    boss1.init(Boss::BOSS_FIRE, sf::Vector2f(512, 200));   // Босс 1 сверху
    boss2.init(Boss::BOSS_SLIME, sf::Vector2f(512, 200));  // Босс 2 сверху

    const std::vector<sf::RectangleShape>* currentCollisions = &obstacles;
    int currentLocationID = 0;

    // === АРЕНЫ БОССОВ ===
    BossLocation boss1Loc;
    BossLocation boss2Loc;

    // Спавн ставим в центр (512, 512), коллизии пока берем пустые или скопируй с plainLoc
    boss1Loc.load("boss1_land.png", sf::Vector2f(512, 512), plainLoc.getObstacles());
    boss2Loc.load("boss2_land.png", sf::Vector2f(512, 512), plainLoc.getObstacles());


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




    // === ХП ГЕРОЯ ===
    int heroMaxHP = 100;
    int heroCurrentHP = 100;

    // === СИСТЕМА УРОВНЕЙ И ОПЫТА ===
    int heroLevel = 1;              // Текущий уровень
    int heroCurrentXP = 0;          // Текущий опыт
    int heroXPToNextLevel = 100;    // Опыт для следующего уровня (100, 200, 300...)

    // === ШРИФТ ДЛЯ ТЕКСТА ===
    sf::Font font;
    // Загружаем стандартный шрифт Windows. 
    // Если файла нет, скажи — я подскажу как сделать без файла шрифта.
    if (!font.loadFromFile("C:/Windows/Fonts/arial.ttf")) {
        std::cout << "Error: Could not load arial.ttf! Text won't show." << std::endl;
    }

    sf::Text levelText;
    levelText.setFont(font);
    levelText.setCharacterSize(20);      // Размер шрифта
    levelText.setFillColor(sf::Color::White); // Цвет (белый)
    levelText.setOutlineThickness(1.f);   // Обводка для читаемости
    levelText.setOutlineColor(sf::Color::Black);

    // Текстуры для XP бара (можно использовать те же что для HP)
    sf::Texture texXPVoid, texXPFill;
    texXPVoid.loadFromFile("xp_bar_void.png");  // Используем ту же пустоту
    texXPFill.loadFromFile("xp_bar.png");        // Твоя зелёная полоска
    texXPVoid.setSmooth(false);
    texXPFill.setSmooth(false);


    // === УРОН ОТ ВРАГОВ ===
    float enemyDamageCooldown = 0.f;  // Таймер кулдауна
    float enemyDamageInterval = 1.f;  // 1 секунда между ударами
    bool isInvulnerable = false;      // Флаг неуязвимости
    float invulnerableTimer = 0.f;    // Таймер мигания
    float invulnerableDuration = 1.5f; // 1.5 секунды неуязвимости




    // Текстуры бара
    sf::Texture texHpVoid, texHpFill;
    if (!texHpVoid.loadFromFile("hp_bar_void.png")) std::cout << "Error loading void" << std::endl;
    if (!texHpFill.loadFromFile("hp_bar.png")) std::cout << "Error loading fill" << std::endl;
    texHpVoid.setSmooth(false);
    texHpFill.setSmooth(false);

    // Спрайты бара
    sf::Sprite sprHpVoid(texHpVoid);
    sf::Sprite sprHpFill(texHpFill);

    // Настройки бара (под твой HUD)
    float barScale = 4.0f;  // Насколько увеличен бар
    float barX = 500.f;     // Позиция X на экране
    float barY = 650.f;     // Позиция Y на экране

    sprHpVoid.setScale(barScale, barScale);
    sprHpVoid.setPosition(barX, barY);
    sprHpFill.setScale(barScale, barScale); // Масштаб меняется динамически
    sprHpFill.setPosition(barX, barY);

    // Функция отрисовки HP бара
    auto drawHPBar = [&](sf::RenderWindow& window, int current, int max,
        sf::Sprite& barVoid, sf::Sprite& barFill,
        float posX, float posY) {
            // Рисуем фон (пустоту)
            barVoid.setPosition(posX, posY);
            window.draw(barVoid);

            // Рисуем заполнение (масштабируем по ширине)
            float hpPercent = static_cast<float>(current) / static_cast<float>(max);
            sf::FloatRect fillBounds = barFill.getGlobalBounds();
            barFill.setScale(4.f * hpPercent, 4.f);  // Масштабируем только по X
            barFill.setPosition(posX, posY);
            window.draw(barFill);

            // Сбрасываем масштаб обратно для следующего кадра
            barFill.setScale(4.f, 4.f);
        };

    // Функция получения урона
    auto takeDamage = [&](int damage) {
        heroCurrentHP -= damage;
        if (heroCurrentHP < 0) heroCurrentHP = 0;
        std::cout << "Hero took " << damage << " damage! HP: "
            << heroCurrentHP << "/" << heroMaxHP << std::endl;

        // Проверка смерти
        if (heroCurrentHP <= 0) {
            std::cout << "Hero died! Respawning..." << std::endl;
            heroCurrentHP = heroMaxHP;
            hero.setPosition(512, 512);
        }
        };

    // Функция получения опыта
    auto gainXP = [&](int xpAmount) {
        heroCurrentXP += xpAmount;
        std::cout << "Hero gained " << xpAmount << " XP! Total: "
            << heroCurrentXP << "/" << heroXPToNextLevel << std::endl;

        // Проверка повышения уровня
        while (heroCurrentXP >= heroXPToNextLevel) {
            // Повышаем уровень!
            heroCurrentXP -= heroXPToNextLevel;  // Оставляем остаток
            heroLevel++;
            heroXPToNextLevel += 100;  // Каждый уровень требует +100 XP

            std::cout << "LEVEL UP! Hero is now level " << heroLevel
                << "! Next level: " << heroXPToNextLevel << " XP" << std::endl;

            // Здесь можно добавить бонусы за уровень (увеличение HP, урона и т.д.)
            heroMaxHP += 10;  // +10 HP за каждый уровень
            heroCurrentHP = heroMaxHP;  // Полное лечение при повышении
        }
        };




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



    // === СИСТЕМА СОХРАНЕНИЙ ===
    GameSaveData saveData;
    bool hasSave = SaveSystem::loadGame(saveData);

    // Если есть сохранение — загружаем данные
    if (hasSave) {
        heroCurrentHP = saveData.heroCurrentHP;
        heroMaxHP = saveData.heroMaxHP;
        heroLevel = saveData.heroLevel;
        heroCurrentXP = saveData.heroCurrentXP;
        heroXPToNextLevel = saveData.heroXPToNextLevel;
        hero.setPosition(saveData.heroPosX, saveData.heroPosY);
        currentLocationID = saveData.currentLocationID;

        std::cout << "Loaded: Level " << heroLevel
            << ", HP " << heroCurrentHP << "/" << heroMaxHP << std::endl;
    }

    // === МЕНЮ ИГРЫ ===
    Menu gameMenu;

    // Добавляем кнопки меню
    gameMenu.addButton("RESUME", [&]() {
        gameMenu.hide();  // Закрыть меню
        });

    gameMenu.addButton("SAVE & QUIT", [&]() {
        // Сохраняем игру
        saveData.heroCurrentHP = heroCurrentHP;
        saveData.heroMaxHP = heroMaxHP;
        saveData.heroLevel = heroLevel;
        saveData.heroCurrentXP = heroCurrentXP;
        saveData.heroXPToNextLevel = heroXPToNextLevel;
        saveData.heroPosX = hero.getPosition().x;
        saveData.heroPosY = hero.getPosition().y;
        saveData.currentLocationID = currentLocationID;

        const auto& equipment = inventory.getEquipment();
        saveData.equippedWeapon = (equipment[0].type != ITEM_NONE) ? 1 : 0;
        saveData.equippedArmor = (equipment[1].type != ITEM_NONE) ? 1 : 0;
        saveData.equippedAccessory = (equipment[2].type != ITEM_NONE) ? 1 : 0;

        SaveSystem::saveGame(saveData);
        window.close();  // Выход
        });

    gameMenu.addButton("EXIT (NO SAVE)", [&]() {
        window.close();  // Выход без сохранения
        });

    // Обновляем тексты кнопок
    gameMenu.updateTexts();


    // === ФУНКЦИЯ ПРОВЕРКИ КОЛЛИЗИЙ ===
    auto checkCollision = [&](sf::FloatRect heroRect) -> bool {
        for (auto& obstacle : *currentCollisions) {
            if (heroRect.intersects(obstacle.getGlobalBounds()))
                return true;
        }
        return false;
        };

    while (window.isOpen()) {
        static bool wasPaused = false;
        // Если меню открыто — полная пауза
        if (gameMenu.isVisible()) {
            sf::Event event;
            while (window.pollEvent(event)) {
                if (event.type == sf::Event::Closed) { /* ...сохранение... */ window.close(); }
                if (event.type == sf::Event::KeyPressed && event.key.code == sf::Keyboard::Escape) {
                    gameMenu.toggle();
                }
                gameMenu.handleInput(event, window);
            }

            // === Обновляем наведение мыши для подсветки кнопок ===
            gameMenu.updateMouseHover(window);

            window.clear(sf::Color(20, 20, 20));
            window.setView(camera);
            if (currentLocationID == 0) window.draw(mapSprite);
            else plainLoc.draw(window);
            portal.draw(window);
            window.draw(hero);
            arrow.draw(window);
            window.setView(window.getDefaultView());
            window.draw(hudBg);
            gameMenu.draw(window);
            window.display();
            wasPaused = true;

            continue;
        }
         // Сбрасываем deltaTime после паузы чтобы не было скачка
        if (wasPaused) {
            clock.restart();  // Сброс таймера
            wasPaused = false;
        }
        sf::Event event;
        while (window.pollEvent(event)) {
            if (event.type == sf::Event::Closed) {
                // Сохранение при закрытии через крестик
                saveData.heroCurrentHP = heroCurrentHP;
                saveData.heroMaxHP = heroMaxHP;
                saveData.heroLevel = heroLevel;
                saveData.heroCurrentXP = heroCurrentXP;
                saveData.heroXPToNextLevel = heroXPToNextLevel;
                saveData.heroPosX = hero.getPosition().x;
                saveData.heroPosY = hero.getPosition().y;
                saveData.currentLocationID = currentLocationID;

                const auto& equipment = inventory.getEquipment();
                saveData.equippedWeapon = (equipment[0].type != ITEM_NONE) ? 1 : 0;
                saveData.equippedArmor = (equipment[1].type != ITEM_NONE) ? 1 : 0;
                saveData.equippedAccessory = (equipment[2].type != ITEM_NONE) ? 1 : 0;

                SaveSystem::saveGame(saveData);
                window.close();
            }

            // === ESC: ОТКРЫТЬ/ЗАКРЫТЬ МЕНЮ ===
            if (event.type == sf::Event::KeyPressed && event.key.code == sf::Keyboard::Escape) {
                gameMenu.toggle();  // Переключить видимость меню
            }

            // Обработка ввода меню (если оно открыто)
            if (gameMenu.isVisible()) {
                gameMenu.handleInput(event, window);
            }

            // Ручное сохранение: F5
            if (event.type == sf::Event::KeyPressed && event.key.code == sf::Keyboard::F5) {
                saveData.heroCurrentHP = heroCurrentHP;
                saveData.heroMaxHP = heroMaxHP;
                saveData.heroLevel = heroLevel;
                saveData.heroCurrentXP = heroCurrentXP;
                saveData.heroXPToNextLevel = heroXPToNextLevel;
                saveData.heroPosX = hero.getPosition().x;
                saveData.heroPosY = hero.getPosition().y;
                saveData.currentLocationID = currentLocationID;

                SaveSystem::saveGame(saveData);
            }
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
        // === ТЕЛЕПОРТАЦИЯ ЧЕРЕЗ ВЫПАВШИЕ ПОРТАЛЫ ===
        if (currentLocationID == 1) { // Только с поляны можно уйти в портал
            int portalIndex = portalManager.checkPlayerCollision(hero.getGlobalBounds());
            if (portalIndex >= 0) {
                auto& portals = portalManager.getPortals();
                if (portals[portalIndex].type == PORTAL_BOSS1) {
                    currentLocationID = 2; // ID Арены 1
                    currentCollisions = &boss1Loc.getObstacles(); // Подключаем стены арены 1
                    hero.setPosition(boss1Loc.getSpawnPos());
                    std::cout << "Teleported to Boss 1 Arena!" << std::endl;
                }
                else if (portals[portalIndex].type == PORTAL_BOSS2) {
                    currentLocationID = 3; // ID Арены 2
                    currentCollisions = &boss2Loc.getObstacles(); // Подключаем стены арены 2
                    hero.setPosition(boss2Loc.getSpawnPos());
                    std::cout << "Teleported to Boss 2 Arena!" << std::endl;
                }
                portalManager.removePortal(portalIndex);
            }
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

        // === ПРОВЕРКА СТОЛКНОВЕНИЙ СТРЕЛЫ ===
        if (arrow.isActive()) {
            // 1. Обычные враги (Поляна)
            if (currentLocationID == 1) {
                auto& enemies = plainLoc.getEnemyManager().getEnemies();
                for (auto& enemy : enemies) {
                    if (!enemy.isDead() && arrow.getBounds().intersects(enemy.getBounds())) {
                        std::cout << "Arrow hit enemy!" << std::endl;
                        int damage = 10;
                        bool died = const_cast<Enemy&>(enemy).takeDamage(damage);
                        if (died) {
                            gainXP(15);
                            if (std::rand() % 100 < 10) {
                                PortalType pType = (std::rand() % 2 == 0) ? PORTAL_BOSS1 : PORTAL_BOSS2;
                                portalManager.spawnPortal(enemy.getPosition(), pType);
                            }
                        }
                        arrow.deactivate();
                        break;
                    }
                }
            }

            // 2. БОСС 1 (Арена ID=2)
            if (currentLocationID == 2 && boss1.isAlive() && arrow.getBounds().intersects(boss1.getBounds())) {
                int prevHP = boss1.getHP();
                boss1.takeDamage(25);
                arrow.deactivate();

                // Проверяем, умер ли босс, и даём XP
                if (prevHP > 0 && boss1.getHP() <= 0) {
                    gainXP(boss1.getXPReward());  // +150 XP
                }
            }

            // 3. БОСС 2 (Арена ID=3)
            if (currentLocationID == 3 && boss2.isAlive() && arrow.getBounds().intersects(boss2.getBounds())) {
                int prevHP = boss2.getHP();
                boss2.takeDamage(25);
                arrow.deactivate();

                // Проверяем, умер ли босс, и даём XP
                if (prevHP > 0 && boss2.getHP() <= 0) {
                    gainXP(boss2.getXPReward());  // +150 XP
                }
            }
        }
        // === ОБНОВЛЕНИЕ ЛОКАЦИИ (ВРАГИ И БОССЫ) ===

        // 1. Поляна (слизни)
        if (currentLocationID == 1) {
            plainLoc.update(deltaTime, hero.getPosition());

            auto& enemies = plainLoc.getEnemyManager().getEnemies();
            for (auto& enemy : enemies) {
                if (!enemy.isDead() && hero.getGlobalBounds().intersects(enemy.getBounds())) {

                    // Если кулдаун прошёл И герой не в неуязвимости
                    if (enemyDamageCooldown <= 0.f && !isInvulnerable) {
                        heroCurrentHP -= 10;
                        enemyDamageCooldown = enemyDamageInterval;
                        isInvulnerable = true;
                        invulnerableTimer = invulnerableDuration;
                        std::cout << "Hit by slime! HP: " << heroCurrentHP << std::endl;

                        // === ПРОВЕРКА СМЕРТИ (СРАЗУ ПОСЛЕ УРОНА) ===
                        if (heroCurrentHP <= 0) {
                            heroCurrentHP = 0; // Фиксируем на 0
                            std::cout << "HERO DIED! Respawning..." << std::endl;

                            // Полный сброс состояния
                            heroCurrentHP = heroMaxHP;
                            hero.setPosition(512, 512); // Или plainLoc.getSpawnPos()
                            isInvulnerable = true;      // Даём безопасные кадры после респауна
                            invulnerableTimer = 2.0f;
                            enemyDamageCooldown = 2.0f; // Чтобы не убили мгновенно снова
                        }
                    }
                }
            }
        }
        // 2. Босс 1 (Арена огненная)
        if (currentLocationID == 2) {
            // Обновляем босса ВСЕГДА (даже если мёртв - для таймера респавна)
            boss1.update(deltaTime, hero.getPosition());

            // Урон герою наносится только если босс жив
            if (boss1.isAlive() && boss1.getBounds().intersects(hero.getGlobalBounds())) {
                if (!isInvulnerable) {
                    heroCurrentHP -= 20;
                    isInvulnerable = true;
                    invulnerableTimer = invulnerableDuration;
                    std::cout << "Hit by Boss 1! HP: " << heroCurrentHP << std::endl;

                    if (heroCurrentHP <= 0) {
                        heroCurrentHP = heroMaxHP;
                        hero.setPosition(512, 512);
                        isInvulnerable = false;
                    }
                }
            }
        }
        if (currentLocationID == 3) {
            // Обновляем босса ВСЕГДА
            boss2.update(deltaTime, hero.getPosition());

            if (boss2.isAlive() && boss2.getBounds().intersects(hero.getGlobalBounds())) {
                if (!isInvulnerable) {
                    heroCurrentHP -= 20;
                    isInvulnerable = true;
                    invulnerableTimer = invulnerableDuration;
                    std::cout << "Hit by Boss 2! HP: " << heroCurrentHP << std::endl;

                    if (heroCurrentHP <= 0) {
                        heroCurrentHP = heroMaxHP;
                        hero.setPosition(512, 512);
                        isInvulnerable = false;
                    }
                }
            }
        }
        // === ОБНОВЛЕНИЕ ТАЙМЕРОВ УРОНА ===
        if (enemyDamageCooldown > 0.f) {
            enemyDamageCooldown -= deltaTime;
        }

        if (isInvulnerable) {
            invulnerableTimer -= deltaTime;
            if (invulnerableTimer <= 0.f) {
                isInvulnerable = false;
            }
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
        else if (currentLocationID == 1) {
            plainLoc.draw(window);
            portalManager.drawAll(window);
        }
        else if (currentLocationID == 2) {
            boss1Loc.draw(window); // Арена Босса 1

            // Рисуем Босса 1
            if (boss1.isAlive()) {
                boss1.draw(window);

                // ХП бар Босса 1
                static sf::Texture bossBarVoidTex, bossBarFillTex;
                static bool bossBarsLoaded = false;
                if (!bossBarsLoaded) {
                    bossBarVoidTex.loadFromFile("hp_bar_void.png");
                    bossBarFillTex.loadFromFile("hp_bar.png");
                    bossBarVoidTex.setSmooth(false);
                    bossBarFillTex.setSmooth(false);
                    bossBarsLoaded = true;
                }

                sf::Vector2f bossPos = boss1.getPosition();
                float barScale = 4.0f;

                sf::Sprite boss1BarVoid(bossBarVoidTex);
                boss1BarVoid.setPosition(bossPos.x - 30, bossPos.y - 35);
                boss1BarVoid.setScale(barScale, barScale);
                window.draw(boss1BarVoid);

                float hpPercent = (float)boss1.getHP() / boss1.getMaxHP();
                int fullWidth = bossBarFillTex.getSize().x;
                int currentWidth = static_cast<int>(fullWidth * hpPercent);

                sf::Sprite boss1BarFill(bossBarFillTex);
                boss1BarFill.setTextureRect(sf::IntRect(0, 0, currentWidth, bossBarFillTex.getSize().y));
                boss1BarFill.setPosition(bossPos.x - 30, bossPos.y - 35);
                boss1BarFill.setScale(barScale, barScale);
                window.draw(boss1BarFill);
            }
        }
        else if (currentLocationID == 3) {
            boss2Loc.draw(window); // Арена Босса 2

            // Рисуем Босса 2
            if (boss2.isAlive()) {
                boss2.draw(window);

                // ХП бар Босса 2 (те же текстуры)
                sf::Vector2f bossPos = boss2.getPosition();
                float barScale = 4.0f;

                sf::Sprite boss2BarVoid;
                boss2BarVoid.setTexture(texHpVoid);
                boss2BarVoid.setPosition(bossPos.x - 30, bossPos.y - 35);
                boss2BarVoid.setScale(barScale, barScale);
                window.draw(boss2BarVoid);

                float hpPercent = (float)boss2.getHP() / boss2.getMaxHP();
                int fullWidth = texHpFill.getSize().x;
                int currentWidth = static_cast<int>(fullWidth * hpPercent);

                sf::Sprite boss2BarFill(texHpFill);
                boss2BarFill.setTextureRect(sf::IntRect(0, 0, currentWidth, texHpFill.getSize().y));
                boss2BarFill.setPosition(bossPos.x - 30, bossPos.y - 35);
                boss2BarFill.setScale(barScale, barScale);
                window.draw(boss2BarFill);
            }
        }
        portal.draw(window);

        // Рисуем героя (мигаем если неуязвим)
        if (!isInvulnerable || static_cast<int>(invulnerableTimer * 10) % 2 == 0) {
            window.draw(hero);
        }

        // === БРОНЯ (ОВЕРЛЕЙ) ===
        static sf::Texture armorOverlayTex;
        static bool armorLoaded = false;

        if (!armorLoaded) {
            if (armorOverlayTex.loadFromFile("armor_overlay.png")) {
                armorOverlayTex.setSmooth(false);
                std::cout << "Armor loaded!" << std::endl;
            }
            else {
                std::cout << "Warning: armor_overlay.png not found!" << std::endl;
            }
            armorLoaded = true;
        }

        sf::Sprite armorOverlay;
        armorOverlay.setTexture(armorOverlayTex);
        armorOverlay.setScale(2.f, 2.f);

        // Рисуем броню если экипирована
        const auto& equipment = inventory.getEquipment();  // ОДИН РАЗ!
        if (equipment[1].type == ITEM_ARMOR) {
            armorOverlay.setPosition(hero.getPosition().x, hero.getPosition().y);
            window.draw(armorOverlay);
        }

        arrow.draw(window);



        // === HUD ===
        window.setView(window.getDefaultView());
        // 1. Рисуем фон HUD
        float hudScale = 6.0f;
        hudBg.setScale(hudScale, hudScale);
        float bgWidth = hudBg.getGlobalBounds().width;
        float bgHeight = hudBg.getGlobalBounds().height;
        hudBg.setPosition((winSize.x - bgWidth) / 2.f, winSize.y - bgHeight - 50);
        window.draw(hudBg);

        // 2. === РИСУЕМ HP БАР ===
        float hpBarX = 650.f;
        float hpBarY = 860.f;
        float barScale = 4.0f;

        sf::Sprite hpVoidSprite(texHpVoid);
        hpVoidSprite.setPosition(hpBarX, hpBarY);
        hpVoidSprite.setScale(barScale, barScale);
        window.draw(hpVoidSprite);

        float hpPercent = static_cast<float>(heroCurrentHP) / static_cast<float>(heroMaxHP);
        if (hpPercent < 0.f) hpPercent = 0.f;
        if (hpPercent > 1.f) hpPercent = 1.f;

        int hpFullWidth = texHpFill.getSize().x;
        int hpCurrentWidth = static_cast<int>(hpFullWidth * hpPercent);

        sf::Sprite hpFillSprite(texHpFill);
        hpFillSprite.setTextureRect(sf::IntRect(0, 0, hpCurrentWidth, texHpFill.getSize().y));
        hpFillSprite.setPosition(hpBarX, hpBarY);
        hpFillSprite.setScale(barScale, barScale);
        window.draw(hpFillSprite);

        // 3. === РИСУЕМ XP БАР (ЗЕЛЁНЫЙ) ===
        float xpBarX = 650.f;   // Чуть левее HP
        float xpBarY = 960.f;  // Ниже (на зелёной полоске)
        float xpBarScale = 4.0f;

        // Фон (пустота)
        sf::Sprite xpVoidSprite(texXPVoid);
        xpVoidSprite.setPosition(xpBarX, xpBarY);
        xpVoidSprite.setScale(xpBarScale, xpBarScale);
        window.draw(xpVoidSprite);

        // Заполнение (зелёная часть)
        float xpPercent = static_cast<float>(heroCurrentXP) / static_cast<float>(heroXPToNextLevel);
        if (xpPercent < 0.f) xpPercent = 0.f;
        if (xpPercent > 1.f) xpPercent = 1.f;

        int xpFullWidth = texXPFill.getSize().x;
        int xpCurrentWidth = static_cast<int>(xpFullWidth * xpPercent);

        sf::Sprite xpFillSprite(texXPFill);
        xpFillSprite.setTextureRect(sf::IntRect(0, 0, xpCurrentWidth, texXPFill.getSize().y));
        xpFillSprite.setPosition(xpBarX, xpBarY);
        xpFillSprite.setScale(xpBarScale, xpBarScale);
        window.draw(xpFillSprite);

        // === РИСУЕМ ТЕКСТ УРОВНЯ ===
      // 1. Обновляем текст
        std::string lvlString = "Level: " + std::to_string(heroLevel);
        levelText.setString(lvlString);

        // 2. Позиционируем под XP баром
        // xpBarY + 45.f означает: позиция бара + высота бара + небольшой отступ
        levelText.setPosition(xpBarX + 20, xpBarY + 45.f);

        // 3. Рисуем
        window.draw(levelText);

        // Остальные бары (MP, XP)
        mpBar.setScale(4.0f, 4.0f); mpBar.setPosition(500, 710); window.draw(mpBar);
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

        // === СТРЕЛЬБА (с кулдауном) ===
        // Обновляем кулдаун
        if (shootCooldown > 0.f) {
            shootCooldown -= deltaTime;
        }

        // Стреляем только если: зажата кнопка + не по HUD + кулдаун прошёл
        if (lmbHeld && !clickedOnHUD && shootCooldown <= 0.f) {
            const auto& equipment = inventory.getEquipment();
            if (equipment[0].type != ITEM_NONE) {  // Лук экипирован

                arrow.deactivate();  // Сбрасываем старую стрелу
                std::cout << "SHOOT!" << std::endl;

                sf::Vector2f heroCenter(
                    hero.getPosition().x + 16,
                    hero.getPosition().y + 16
                );

                sf::Vector2f toMouse = mouseWorld - heroCenter;
                float len = std::sqrt(toMouse.x * toMouse.x + toMouse.y * toMouse.y);
                if (len > 0.f) toMouse /= len;

                arrow.shoot(heroCenter, toMouse, equipment[0].damage);

                // Запускаем анимацию атаки
                if (!isAttacking) {
                    isAttacking = true;
                    attackFrame = 0;
                    attackTimer = 0.f;
                }

                // === ЗАПУСКАЕМ КУЛДАУН ===
                shootCooldown = shootCooldownTime;
            }
        }
        // Индикатор готовности к выстрелу (маленькая точка)
        sf::CircleShape readyIndicator(3.f);
        if (shootCooldown <= 0.f) {
            readyIndicator.setFillColor(sf::Color::Green);  // Можно стрелять
        }
        else {
            readyIndicator.setFillColor(sf::Color::Red);    // Кулдаун
        }
        readyIndicator.setPosition(10, 10);  // Угол экрана
        window.draw(readyIndicator);

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
        // === ОТРИСОВКА МЕНЮ (поверх всего) ===
        if (gameMenu.isVisible()) {
            gameMenu.draw(window);
        }
        window.display();
    }

    return 0;
}
