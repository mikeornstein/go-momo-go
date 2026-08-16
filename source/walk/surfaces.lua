-- Authored walk surfaces. Grass is a type, not decoration.

local gfx <const> = playdate.graphics

local YARDS_BOTTOM <const> = 96
local SIDEWALK_BOTTOM <const> = 192

local PEE_OK = {
    hydrant = true,
    patchy = true,
    nice = true,
    forbidden = true,
}

local POO_OK = {
    nice = true,
    premium = true,
}

-- Horizontal-stable dithers (do not flash under 2 px scroll).
local PATCHY_PATTERN <const> = {0xAA, 0xAA, 0xAA, 0xAA, 0xAA, 0xAA, 0xAA, 0xAA}
local NICE_PATTERN <const> = {0xFF, 0xFF, 0x00, 0x00, 0xFF, 0xFF, 0x00, 0x00}
local FORBIDDEN_PATTERN <const> = {0xCC, 0xCC, 0x33, 0x33, 0xCC, 0xCC, 0x33, 0x33}

-- Walk 1 block. World X, width, kind. Yards unless hydrant (sidewalk plug).
local WALK1 <const> = {
    {x = 300, w = 36, kind = "hydrant"},
    {x = 520, w = 180, kind = "patchy"},
    {x = 880, w = 150, kind = "forbidden"},
    {x = 1240, w = 220, kind = "nice"},
}

Surfaces = {}
Surfaces.__index = Surfaces
Surfaces.YARDS_BOTTOM = YARDS_BOTTOM
Surfaces.SIDEWALK_BOTTOM = SIDEWALK_BOTTOM

function Surfaces.walk1()
    local self = setmetatable({}, Surfaces)
    self.patches = WALK1
    return self
end

function Surfaces:at(worldX, worldY)
    if worldY > SIDEWALK_BOTTOM + 8 then
        return "street", nil
    end

    for i = 1, #self.patches do
        local p = self.patches[i]
        if p.kind == "hydrant"
            and worldX >= p.x and worldX <= p.x + p.w
            and worldY >= YARDS_BOTTOM - 16 and worldY <= SIDEWALK_BOTTOM + 4
        then
            return "hydrant", p
        end
    end

    if worldY >= YARDS_BOTTOM then
        return "sidewalk", nil
    end

    for i = 1, #self.patches do
        local p = self.patches[i]
        if p.kind ~= "hydrant" and worldX >= p.x and worldX <= p.x + p.w then
            return p.kind, p
        end
    end

    return "dirt", nil
end

function Surfaces.allowsPee(kind)
    return PEE_OK[kind] == true
end

function Surfaces.allowsPoo(kind)
    return POO_OK[kind] == true
end

function Surfaces.pooFails(kind)
    return kind == "forbidden"
end

function Surfaces:nearest(want, walkerX, maxDist)
    local best, bestD = nil, maxDist + 1
    for i = 1, #self.patches do
        local p = self.patches[i]
        local legal = (want == "poo" and Surfaces.allowsPoo(p.kind))
            or (want == "pee" and Surfaces.allowsPee(p.kind) and not Surfaces.pooFails(p.kind))
        -- Skip patches the walker has already passed so Momo is not hauled back.
        if legal and p.x + p.w >= walkerX then
            local cx = p.x + p.w / 2
            local d = math.abs(cx - walkerX)
            if d < bestD then
                bestD = d
                best = p
            end
        end
    end
    if not best then
        return nil
    end
    local cy = SIDEWALK_BOTTOM
    if best.kind ~= "hydrant" then
        cy = YARDS_BOTTOM - 8
    end
    return best.x + best.w / 2, cy, best
end

function Surfaces:drawGrass(cameraX, screenW)
    for i = 1, #self.patches do
        local p = self.patches[i]
        local x = p.x - cameraX
        if x < screenW and x + p.w > 0 then
            if p.kind == "patchy" then
                gfx.setPattern(PATCHY_PATTERN)
                gfx.fillRect(x, 0, p.w, YARDS_BOTTOM)
                gfx.setColor(gfx.kColorBlack)
                Surfaces.drawTufts(x, p.w, 3)
            elseif p.kind == "nice" then
                gfx.setPattern(NICE_PATTERN)
                gfx.fillRect(x, 0, p.w, YARDS_BOTTOM)
                gfx.setColor(gfx.kColorBlack)
                Surfaces.drawTufts(x, p.w, 6)
            elseif p.kind == "forbidden" then
                gfx.setPattern(FORBIDDEN_PATTERN)
                gfx.fillRect(x, 0, p.w, YARDS_BOTTOM)
            end
        end
    end
end

function Surfaces:drawProps(cameraX, screenW)
    for i = 1, #self.patches do
        local p = self.patches[i]
        local x = p.x - cameraX
        if x < screenW and x + p.w > 0 then
            if p.kind == "hydrant" then
                Surfaces.drawHydrant(x + p.w / 2, YARDS_BOTTOM)
            elseif p.kind == "forbidden" then
                Surfaces.drawGnome(x + p.w / 2, YARDS_BOTTOM)
            end
        end
    end
end

function Surfaces.drawHydrant(x, groundY)
    gfx.setColor(gfx.kColorWhite)
    gfx.fillRect(x - 8, groundY - 28, 16, 28)
    gfx.setColor(gfx.kColorBlack)
    gfx.drawRect(x - 8, groundY - 28, 16, 28)
    gfx.fillRect(x - 12, groundY - 18, 6, 6)
    gfx.fillRect(x + 6, groundY - 18, 6, 6)
    gfx.fillRect(x - 4, groundY - 32, 8, 6)
end

function Surfaces.drawGnome(x, groundY)
    gfx.setColor(gfx.kColorWhite)
    gfx.fillCircleAtPoint(x, groundY - 18, 10)
    gfx.setColor(gfx.kColorBlack)
    gfx.drawCircleAtPoint(x, groundY - 18, 10)
    gfx.fillTriangle(x - 10, groundY - 24, x + 10, groundY - 24, x, groundY - 42)
    gfx.drawLine(x - 18, groundY, x - 18, groundY - 36)
    gfx.drawLine(x + 18, groundY, x + 18, groundY - 36)
end

function Surfaces.drawTufts(screenX, w, count)
    local step = w / (count + 1)
    for i = 1, count do
        local sx = screenX + step * i
        local gy = YARDS_BOTTOM
        gfx.drawLine(sx, gy, sx - 3, gy - 6)
        gfx.drawLine(sx, gy, sx + 3, gy - 6)
        gfx.drawLine(sx, gy, sx, gy - 8)
    end
end
